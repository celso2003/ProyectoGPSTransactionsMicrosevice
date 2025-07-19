const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

// Product model
class Product extends Model {}
Product.init({
  productid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meassure: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'product',
  timestamps: false
});

// Person model
class Person extends Model {}
Person.init({
  rut: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  beneficiaryid: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Person',
  tableName: 'persons',
  timestamps: false
});

// Transaction model
class Transaction extends Model {}
Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transactionDate'
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Person,
      key: 'rut'
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM,
    values: ['cash', 'credit_card', 'bank_transfer', 'check', 'credit_line'],
    allowNull: false,
    field: 'paymentMethod'
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    field: 'totalAmount'
  },
  notes: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transacction',
  timestamps: true,
  underscored: false
});

// Product Transaction model (junction table)
class ProductTransaction extends Model {}
ProductTransaction.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  TransactionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Transaction,
      key: 'id'
    },
    field: 'TransactionId'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'productid'
    },
    field: 'productId'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ProductTransaction',
  tableName: 'product_transaccion',
  timestamps: false
});

// Establish relationships
Person.hasMany(Transaction, { foreignKey: 'rut' });
Transaction.belongsTo(Person, { foreignKey: 'rut' });

Transaction.hasMany(ProductTransaction, { foreignKey: 'TransactionId' });
ProductTransaction.belongsTo(Transaction, { foreignKey: 'TransactionId' });

Product.hasMany(ProductTransaction, { foreignKey: 'productId' });
ProductTransaction.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
  Person,
  Product,
  Transaction,
  ProductTransaction
};
