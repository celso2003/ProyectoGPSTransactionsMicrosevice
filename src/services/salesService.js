const { Transaction, ProductTransaction, Product, Person } = require('../models/transaction');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class SalesService {
  
  async createSale(transactionData, products) {
    const transaction = await sequelize.transaction();

    try {
      // Verificar si la persona existe
      const personExists = await Person.findByPk(transactionData.rut);
      if (!personExists) {
        await transaction.rollback();
        throw new Error('PERSON_NOT_FOUND');
      }

      // Crear registro de transacción de venta (isasale = true)
      const newTransaction = await Transaction.create({
        ...transactionData,
        isasale: true, // Esto asegura que sea una venta
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
            price: product.price
          }, { transaction });
        }
      }

      // Actualizar el monto total si no se proporciona
      if (!transactionData.totalAmount) {
        await newTransaction.update({ totalAmount }, { transaction });
      }

      await transaction.commit();

      // Obtener la transacción completa con productos
      const completeSale = await Transaction.findByPk(newTransaction.id, {
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

      return completeSale;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllSales(filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const { startDate, endDate, rut, paymentMethod } = filters;

    // Preparar objeto de filtro
    const where = { isasale: true }; // Solo ventas
    
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

    const { rows: sales, count: totalSales } = await Transaction.findAndCountAll({
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
      totalSales,
      currentPage: parseInt(page),
      sales
    };
  }

  async getSaleById(id) {
    const sale = await Transaction.findOne({
      where: {
        id,
        isasale: true // Asegurar que sea una venta
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

    if (!sale) {
      throw new Error('SALE_NOT_FOUND');
    }

    return sale;
  }

  async updateSale(id, transactionData, products) {
    const dbTransaction = await sequelize.transaction();

    try {
      const sale = await Transaction.findOne({
        where: {
          id,
          isasale: true // Solo actualizar si es una venta
        }
      });
      
      if (!sale) {
        await dbTransaction.rollback();
        throw new Error('SALE_NOT_FOUND');
      }

      // Verificar si la persona existe si se actualiza el rut
      if (transactionData.rut && transactionData.rut !== sale.rut) {
        const personExists = await Person.findByPk(transactionData.rut);
        if (!personExists) {
          await dbTransaction.rollback();
          throw new Error('PERSON_NOT_FOUND');
        }
      }

      // Asegurar que sigue siendo una venta
      transactionData.isasale = true;
      
      // Actualizar transacción
      await sale.update(transactionData, { transaction: dbTransaction });

      // Actualizar productos si se proporcionan
      if (products && Array.isArray(products)) {
        // Eliminar transacciones de productos existentes
        await ProductTransaction.destroy({
          where: { TransactionId: sale.id },
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
            TransactionId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price
          }, { transaction: dbTransaction });
        }

        // Actualizar el monto total si no se proporciona explícitamente
        if (!transactionData.totalAmount) {
          await sale.update({ totalAmount }, { transaction: dbTransaction });
        }
      }

      await dbTransaction.commit();

      // Obtener la venta actualizada con productos
      const updatedSale = await Transaction.findByPk(sale.id, {
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

      return updatedSale;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async deleteSale(id) {
    const dbTransaction = await sequelize.transaction();
    
    try {
      const sale = await Transaction.findOne({
        where: {
          id,
          isasale: true // Solo eliminar si es una venta
        }
      });
      
      if (!sale) {
        await dbTransaction.rollback();
        throw new Error('SALE_NOT_FOUND');
      }

      // Eliminar primero las transacciones de productos asociadas
      await ProductTransaction.destroy({
        where: { TransactionId: sale.id },
        transaction: dbTransaction
      });

      // Luego eliminar la venta
      await sale.destroy({ transaction: dbTransaction });

      await dbTransaction.commit();
      return true;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  async getSalesByRut(rut) {
    // Validar si la persona existe
    const personExists = await Person.findByPk(rut);
    if (!personExists) {
      throw new Error('PERSON_NOT_FOUND');
    }
    
    // Consultar ventas con este RUT
    const sales = await Transaction.findAll({
      where: { 
        rut,
        isasale: true // Solo ventas
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
      totalSales: sales.length,
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      sales
    };
  }

  async getSalesByDateRange(filters, pagination) {
    const { startDate, endDate } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    if (!startDate && !endDate) {
      throw new Error('DATE_REQUIRED');
    }
    
    const where = { 
      transactionDate: {},
      isasale: true // Solo ventas
    };
    
    if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
    if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: sales, count: totalSales } = await Transaction.findAndCountAll({
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
    sales.forEach(s => {
      if (s.transactionDate) {
        const date = new Date(s.transactionDate);
        s.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalSales,
      currentPage: parseInt(page),
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      sales
    };
  }

  async getSalesByDateRangeAndRut(filters, pagination) {
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
      isasale: true // Solo ventas
    };
    
    // Agregar filtros de fecha si se proporcionan
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows: sales, count: totalSales } = await Transaction.findAndCountAll({
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
    sales.forEach(s => {
      if (s.transactionDate) {
        const date = new Date(s.transactionDate);
        s.formattedDate = date.toLocaleString('en-US', { timeZone: 'America/Santiago' });
      }
    });

    return {
      totalSales,
      currentPage: parseInt(page),
      rut,
      personName: `${personExists.name} ${personExists.lastname || ''}`,
      startDate: startDate || 'Sin límite inferior',
      endDate: endDate || 'Sin límite superior',
      sales
    };
  }
}

module.exports = new SalesService();
