const { sequelize } = require('../config/database');
const { SalesTransaction, SalesProduct } = require('../models/salesTransaction');
const { PurchaseTransaction, PurchaseProduct } = require('../models/purchaseTransaction');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Drop and recreate tables

    // Seed sales transactions
    const sales1 = await SalesTransaction.create({
      transactionDate: new Date(),
      customerId: 'CUST001',
      paymentMethod: 'cash',
      notes: 'Test sale',
      products: [
        { productId: 'PROD001', quantity: 2, unitPrice: 10.5 },
        { productId: 'PROD002', quantity: 1, unitPrice: 20.0 }
      ]
    }, { include: [{ model: SalesProduct, as: 'products' }] });

    const sales2 = await SalesTransaction.create({
      transactionDate: new Date(),
      customerId: 'CUST002',
      paymentMethod: 'credit_card',
      notes: 'Another test sale',
      products: [
        { productId: 'PROD003', quantity: 5, unitPrice: 5.0 }
      ]
    }, { include: [{ model: SalesProduct, as: 'products' }] });

    // Seed purchase transactions
    const purchase1 = await PurchaseTransaction.create({
      transactionDate: new Date(),
      supplierId: 'SUP001',
      paymentMethod: 'bank_transfer',
      notes: 'Test purchase',
      products: [
        { productId: 'PROD001', quantity: 10, unitCost: 8.0 },
        { productId: 'PROD002', quantity: 5, unitCost: 15.0 }
      ]
    }, { include: [{ model: PurchaseProduct, as: 'products' }] });

    const purchase2 = await PurchaseTransaction.create({
      transactionDate: new Date(),
      supplierId: 'SUP002',
      paymentMethod: 'cash',
      notes: 'Another test purchase',
      products: [
        { productId: 'PROD003', quantity: 20, unitCost: 3.0 }
      ]
    }, { include: [{ model: PurchaseProduct, as: 'products' }] });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 