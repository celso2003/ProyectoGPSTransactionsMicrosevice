const { Transaction, ProductTransaction, Product, Person } = require('../models/transaction');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class TransactionService {
  
  async createTransaction(transactionData, products) {
    const transaction = await sequelize.transaction();

    try {
      // Verificar si la persona existe
      const personExists = await Person.findByPk(transactionData.rut);
      if (!personExists) {
        await transaction.rollback();
        throw new Error('PERSON_NOT_FOUND');
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
            throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
          }

          // Sumar al monto total
          totalAmount += product.price * item.quantity;

          // Crear registro de transacción de producto
          await ProductTransaction.create({
            TransactionId: newTransaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price // <--- Agregar esto
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

      return completeTransaction;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllTransactions(filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const { startDate, endDate, rut, paymentMethod } = filters;

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

    return {
      totalTransactions,
      currentPage: parseInt(page),
      transactions
    };
  }

  async getTransactionById(id) {
    const transaction = await Transaction.findByPk(id, {
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
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    return transaction;
  }

  async updateTransaction(id, transactionData, products) {
    const dbTransaction = await sequelize.transaction();

    try {
      const transaction = await Transaction.findByPk(id);
      
      if (!transaction) {
        await dbTransaction.rollback();
        throw new Error('TRANSACTION_NOT_FOUND');
      }

      // Verificar si la persona existe si se actualiza el rut
      if (transactionData.rut && transactionData.rut !== transaction.rut) {
        const personExists = await Person.findByPk(transactionData.rut);
        if (!personExists) {
          await dbTransaction.rollback();
          throw new Error('PERSON_NOT_FOUND');
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
            throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
          }

          // Sumar al monto total
          totalAmount += product.price * item.quantity;

          // Crear registro de transacción de producto
          await ProductTransaction.create({
            TransactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price // <--- Agregar esto
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

      return updatedTransaction;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async deleteTransaction(id) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const transaction = await Transaction.findByPk(id);
      
      if (!transaction) {
        await dbTransaction.rollback();
        throw new Error('TRANSACTION_NOT_FOUND');
      }

      // Eliminar primero las transacciones de productos asociadas
      await ProductTransaction.destroy({
        where: { TransactionId: transaction.id },
        transaction: dbTransaction
      });

      // Luego eliminar la transacción
      await transaction.destroy({ transaction: dbTransaction });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getTransactionsByRut(rut) {
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      throw new Error('PERSON_NOT_FOUND');
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

    return {
      totalTransactions: transactions.length,
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      transactions
    };
  }

  async getTransactionsByDateRange(filters, pagination) {
    const { startDate, endDate } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    if (!startDate && !endDate) {
      throw new Error('DATE_REQUIRED');
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

    // Formatear fechas
    transactions.forEach(t => {
      if (t.transactionDate) {
        const date = new Date(t.transactionDate);
        t.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalTransactions,
      currentPage: parseInt(page),
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      transactions
    };
  }

  async getTransactionsByDateRangeAndRut(filters, pagination) {
    const { startDate, endDate, rut } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    if (!rut) {
      throw new Error('RUT_REQUIRED');
    }
    
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      throw new Error('PERSON_NOT_FOUND');
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

    // Formatear fechas
    transactions.forEach(t => {
      if (t.transactionDate) {
        const date = new Date(t.transactionDate);
        t.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalTransactions,
      currentPage: parseInt(page),
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      transactions
    };
  }
}

module.exports = new TransactionService();
