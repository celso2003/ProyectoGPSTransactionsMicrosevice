const { Transaction, ProductTransaction, Product, Person } = require('../models/transaction');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class PurchaseService {
  
  async createPurchase(transactionData, products) {
    const transaction = await sequelize.transaction();

    try {
      // Verificar si la persona existe
      const personExists = await Person.findByPk(transactionData.rut);
      if (!personExists) {
        await transaction.rollback();
        throw new Error('PERSON_NOT_FOUND');
      }

      // Crear registro de transacción de compra (isasale = false)
      const newTransaction = await Transaction.create({
        ...transactionData,
        isasale: false, // Esto asegura que sea una compra
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
      const completePurchase = await Transaction.findByPk(newTransaction.id, {
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

      return completePurchase;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllPurchases(filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const { startDate, endDate, rut, paymentMethod } = filters;

    // Preparar objeto de filtro
    const where = { isasale: false }; // Solo compras
    
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

    const { rows: purchases, count: totalPurchases } = await Transaction.findAndCountAll({
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
      totalPurchases,
      currentPage: parseInt(page),
      purchases
    };
  }

  async getPurchaseById(id) {
    const purchase = await Transaction.findOne({
      where: {
        id,
        isasale: false // Asegurar que sea una compra
      },
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

    if (!purchase) {
      throw new Error('PURCHASE_NOT_FOUND');
    }

    return purchase;
  }

  async updatePurchase(id, transactionData, products) {
    const dbTransaction = await sequelize.transaction();

    try {
      const purchase = await Transaction.findOne({
        where: {
          id,
          isasale: false // Solo actualizar si es una compra
        }
      });
      
      if (!purchase) {
        await dbTransaction.rollback();
        throw new Error('PURCHASE_NOT_FOUND');
      }

      // Verificar si la persona existe si se actualiza el rut
      if (transactionData.rut && transactionData.rut !== purchase.rut) {
        const personExists = await Person.findByPk(transactionData.rut);
        if (!personExists) {
          await dbTransaction.rollback();
          throw new Error('PERSON_NOT_FOUND');
        }
      }

      // Asegurar que sigue siendo una compra
      transactionData.isasale = false;
      
      // Actualizar transacción
      await purchase.update(transactionData, { transaction: dbTransaction });

      // Actualizar productos si se proporcionan
      if (products && Array.isArray(products)) {
        // Eliminar transacciones de productos existentes
        await ProductTransaction.destroy({
          where: { TransactionId: purchase.id },
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
            TransactionId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price // <--- Agregar esto
          }, { transaction: dbTransaction });
        }

        // Actualizar el monto total si no se proporciona explícitamente
        if (!transactionData.totalAmount) {
          await purchase.update({ totalAmount }, { transaction: dbTransaction });
        }
      }

      await dbTransaction.commit();

      // Obtener la compra actualizada con productos
      const updatedPurchase = await Transaction.findByPk(purchase.id, {
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

      return updatedPurchase;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async deletePurchase(id) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const purchase = await Transaction.findOne({
        where: {
          id,
          isasale: false // Solo eliminar si es una compra
        }
      });
      
      if (!purchase) {
        await dbTransaction.rollback();
        throw new Error('PURCHASE_NOT_FOUND');
      }

      // Eliminar primero las transacciones de productos asociadas
      await ProductTransaction.destroy({
        where: { TransactionId: purchase.id },
        transaction: dbTransaction
      });

      // Luego eliminar la compra
      await purchase.destroy({ transaction: dbTransaction });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getPurchasesByRut(rut) {
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      throw new Error('PERSON_NOT_FOUND');
    }
    
    // Consultar compras con este RUT
    const purchases = await Transaction.findAll({
      where: { 
        rut,
        isasale: false // Solo compras
      },
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
      totalPurchases: purchases.length,
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      purchases
    };
  }

  async getPurchasesByDateRange(filters, pagination) {
    const { startDate, endDate } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    if (!startDate && !endDate) {
      throw new Error('DATE_REQUIRED');
    }
    
    const where = { 
      transactionDate: {},
      isasale: false // Solo compras
    };
    
    if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
    if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: purchases, count: totalPurchases } = await Transaction.findAndCountAll({
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
    purchases.forEach(p => {
      if (p.transactionDate) {
        const date = new Date(p.transactionDate);
        p.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalPurchases,
      currentPage: parseInt(page),
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      purchases
    };
  }

  async getPurchasesByDateRangeAndRut(filters, pagination) {
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
    
    const where = { 
      rut,
      isasale: false // Solo compras
    };
    
    // Agregar filtros de fecha si se proporcionan
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: purchases, count: totalPurchases } = await Transaction.findAndCountAll({
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
    purchases.forEach(p => {
      if (p.transactionDate) {
        const date = new Date(p.transactionDate);
        p.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalPurchases,
      currentPage: parseInt(page),
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      purchases
    };
  }
}

module.exports = new PurchaseService();
