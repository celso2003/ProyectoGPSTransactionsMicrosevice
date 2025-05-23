const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  }
});

const purchaseTransactionSchema = new mongoose.Schema({
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  supplierId: {
    type: String,
    required: true
  },
  products: {
    type: [productSchema],
    required: true,
    validate: [
      {
        validator: function(products) {
          return products.length > 0;
        },
        message: 'At least one product is required for a purchase transaction'
      }
    ]
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'credit_line']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to calculate totalAmount before saving if not provided
purchaseTransactionSchema.pre('save', function(next) {
  if (!this.isModified('products') && this.totalAmount) {
    return next();
  }
  
  this.totalAmount = this.products.reduce((total, product) => {
    return total + (product.quantity * product.unitCost);
  }, 0);
  
  next();
});

const PurchaseTransaction = mongoose.model('PurchaseTransaction', purchaseTransactionSchema);

module.exports = PurchaseTransaction; 