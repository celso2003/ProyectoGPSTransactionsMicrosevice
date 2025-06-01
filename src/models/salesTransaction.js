const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SalesTransaction extends Model {}
class SalesProduct extends Model {}

SalesTransaction.init({
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
  customerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'),
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
  modelName: 'SalesTransaction',
  tableName: 'sales_transactions',
  timestamps: true,
});

SalesProduct.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  salesTransactionId: {
    type: DataTypes.INTEGER,
    references: {
      model: SalesTransaction,
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
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 },
  },
}, {
  sequelize,
  modelName: 'SalesProduct',
  tableName: 'sales_products',
  timestamps: false,
});

SalesTransaction.hasMany(SalesProduct, { foreignKey: 'salesTransactionId', as: 'products' });
SalesProduct.belongsTo(SalesTransaction, { foreignKey: 'salesTransactionId' });

module.exports = { SalesTransaction, SalesProduct }; 