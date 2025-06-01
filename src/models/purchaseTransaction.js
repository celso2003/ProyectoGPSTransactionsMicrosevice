const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PurchaseTransaction extends Model {}
class PurchaseProduct extends Model {}

PurchaseTransaction.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  supplierId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit_card', 'bank_transfer', 'check', 'credit_line'),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'PurchaseTransaction',
  tableName: 'purchase_transactions',
  timestamps: true,
});

PurchaseProduct.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  purchaseTransactionId: {
    type: DataTypes.INTEGER,
    references: {
      model: PurchaseTransaction,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  unitCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 },
  },
}, {
  sequelize,
  modelName: 'PurchaseProduct',
  tableName: 'purchase_products',
  timestamps: false,
});

PurchaseTransaction.hasMany(PurchaseProduct, { foreignKey: 'purchaseTransactionId', as: 'products' });
PurchaseProduct.belongsTo(PurchaseTransaction, { foreignKey: 'purchaseTransactionId' });

module.exports = { PurchaseTransaction, PurchaseProduct }; 