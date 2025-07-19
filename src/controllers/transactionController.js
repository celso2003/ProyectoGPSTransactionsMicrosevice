const { Transaction, ProductTransaction, Product, Person } = require('../models/transaction');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
// Corregir la declaración de importación para date-fns-tz
const { format } = require('date-fns-tz');

// Crear una nueva transacción
exports.createTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { products, ...transactionData } = req.body;

    // Verificar si la persona existe
    const personExists = await Person.findByPk(transactionData.rut);
    if (!personExists) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Persona con el RUT proporcionado no encontrada' });
    }

    // Crear registro de transacción
    const newTransaction = await Transaction.create({
      ...transactionData,
      transactionDate: transactionData.transactionDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    // Calcular el monto total y crear transacciones de productos
    let totalAmount = 0;

    // Crear registros de transacciones de productos
    if (Array.isArray(products) && products.length > 0) {
      for (const item of products) {
        // Verificar si el producto existe
        const product = await Product.findByPk(item.productId);
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Producto con ID ${item.productId} no encontrado` });
        }

        // Sumar al monto total
        totalAmount += product.price * item.quantity;

        // Crear registro de transacción de producto
        await ProductTransaction.create({
          TransactionId: newTransaction.id,
          productId: item.productId,
          quantity: item.quantity
        }, { transaction });
      }
    }

    // Actualizar el monto total si no se proporciona
    if (!transactionData.totalAmount) {
      await newTransaction.update({ totalAmount }, { transaction });
    }

    await transaction.commit();

    // Obtener la transacción completa con productos
    const completeTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    logger.info(`Transacción creada con ID: ${newTransaction.id}`);
    return res.status(201).json(completeTransaction);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al crear la transacción: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener todas las transacciones con paginación y filtrado
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      rut,
      paymentMethod
    } = req.query;

    // Preparar objeto de filtro
    const where = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }

    if (rut) {
      where.rut = rut;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: transactions, count: totalTransactions } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transactionDate', 'DESC']]
    });

    logger.info(`Se recuperaron ${transactions.length} transacciones`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      transactions
    });
  } catch (error) {
    logger.error(`Error al recuperar transacciones: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener una transacción por ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    if (!transaction) {
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    logger.info(`Transacción recuperada con ID: ${req.params.id}`);
    return res.status(200).json(transaction);
  } catch (error) {
    logger.error(`Error al recuperar la transacción: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una transacción
exports.updateTransaction = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { products, ...transactionData } = req.body;
    const transaction = await Transaction.findByPk(req.params.id);
    
    if (!transaction) {
      await dbTransaction.rollback();
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    // Verificar si la persona existe si se actualiza el rut
    if (transactionData.rut && transactionData.rut !== transaction.rut) {
      const personExists = await Person.findByPk(transactionData.rut);
      if (!personExists) {
        await dbTransaction.rollback();
        return res.status(404).json({ message: 'Persona con el RUT proporcionado no encontrada' });
      }
    }

    // Actualizar transacción
    await transaction.update(transactionData, { transaction: dbTransaction });

    // Actualizar productos si se proporcionan
    if (products && Array.isArray(products)) {
      // Eliminar transacciones de productos existentes
      await ProductTransaction.destroy({
        where: { TransactionId: transaction.id },
        transaction: dbTransaction
      });

      // Calcular nuevo total
      let totalAmount = 0;

      // Crear nuevas transacciones de productos
      for (const item of products) {
        // Verificar si el producto existe
        const product = await Product.findByPk(item.productId);
        if (!product) {
          await dbTransaction.rollback();
          return res.status(404).json({ message: `Producto con ID ${item.productId} no encontrado` });
        }

        // Sumar al monto total
        totalAmount += product.price * item.quantity;

        // Crear registro de transacción de producto
        await ProductTransaction.create({
          TransactionId: transaction.id,
          productId: item.productId,
          quantity: item.quantity
        }, { transaction: dbTransaction });
      }

      // Actualizar el monto total si no se proporciona explícitamente
      if (!transactionData.totalAmount) {
        await transaction.update({ totalAmount }, { transaction: dbTransaction });
      }
    }

    await dbTransaction.commit();

    // Obtener la transacción actualizada con productos
    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ]
    });

    logger.info(`Transacción actualizada con ID: ${req.params.id}`);
    return res.status(200).json(updatedTransaction);
  } catch (error) {
    await dbTransaction.rollback();
    logger.error(`Error al actualizar la transacción: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Eliminar una transacción
exports.deleteTransaction = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    
    if (!transaction) {
      await dbTransaction.rollback();
      logger.warn(`Transacción no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    // Eliminar primero las transacciones de productos asociadas
    await ProductTransaction.destroy({
      where: { TransactionId: transaction.id },
      transaction: dbTransaction
    });

    // Luego eliminar la transacción
    await transaction.destroy({ transaction: dbTransaction });

    await dbTransaction.commit();
    logger.info(`Transacción eliminada con ID: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    await dbTransaction.rollback();
    logger.error(`Error al eliminar la transacción: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por RUT
exports.getTransactionsByRut = async (req, res) => {
  try {
    const rut = req.params.rut;
    
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      logger.warn(`Persona con RUT ${rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    // Consultar transacciones con este RUT
    const transactions = await Transaction.findAll({
      where: { rut },
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ],
      order: [['transactionDate', 'DESC']]
    });

    logger.info(`Se recuperaron ${transactions.length} transacciones para el RUT: ${rut}`);
    return res.status(200).json({
      totalTransactions: transactions.length,
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      transactions
    });
  } catch (error) {
    logger.error(`Error al recuperar transacciones por RUT: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por rango de fechas
exports.getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    if (!startDate && !endDate) {
      return res.status(400).json({ message: 'Se requiere al menos un parámetro de fecha (startDate o endDate)' });
    }
    
    const where = { transactionDate: {} };
    
    if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
    if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: transactions, count: totalTransactions } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transactionDate', 'DESC']]
    });

    // Formatear fechas usando métodos estándar de JavaScript en vez de utcToZonedTime
    transactions.forEach(t => {
      if (t.transactionDate) {
        // Crear una cadena de fecha formateada en la zona horaria de Santiago
        const date = new Date(t.transactionDate);
        // Usar toLocaleString con opción de zona horaria en vez de utcToZonedTime
        t.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
        // Mantener el transactionDate original
      }
    });

    logger.info(`Se recuperaron ${transactions.length} transacciones por rango de fechas`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      transactions
    });
  } catch (error) {
    logger.error(`Error al recuperar transacciones por rango de fechas: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// Obtener transacciones por rango de fechas y RUT
exports.getTransactionsByDateRangeAndRut = async (req, res) => {
  try {
    const { startDate, endDate, rut, page = 1, limit = 10 } = req.query;
    
    if (!rut) {
      return res.status(400).json({ message: 'El parámetro RUT es requerido' });
    }
    
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      logger.warn(`Persona con RUT ${rut} no encontrada`);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    
    const where = { rut };
    
    // Agregar filtros de fecha si se proporcionan
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: transactions, count: totalTransactions } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: ProductTransaction,
          include: [Product]
        },
        {
          model: Person
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['transactionDate', 'DESC']]
    });

    // Formatear fechas usando métodos estándar de JavaScript
    transactions.forEach(t => {
      if (t.transactionDate) {
        const date = new Date(t.transactionDate);
        t.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    logger.info(`Se recuperaron ${transactions.length} transacciones para el RUT: ${rut} en el rango de fechas especificado`);
    return res.status(200).json({
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      transactions
    });
  } catch (error) {
    logger.error(`Error al recuperar transacciones por rango de fechas y RUT: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};
