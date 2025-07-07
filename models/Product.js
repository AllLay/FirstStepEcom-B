const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    type: String,
    stock: Number,
    image: String,
    description: String,
    status: { type: String, default: 'active' },
    user_id: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);