const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    card: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
    }],
    shippingAddress: {
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    totalAmount: Number,
    paymentStatus: String,
    orderStatus: String
}, { timestamps: true });

const OrderItem = mongoose.model('OrderItem', OrderItemSchema);
const Order = mongoose.model('Order', OrderSchema);

module.exports = { Order, OrderItem };