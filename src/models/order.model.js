const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem", required: true }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
    totalAmount: { type: Number, required: true },
    orderStatus: { type: String, enum: ["Processing", "Shipped", "Delivered", "Cancelled"], default: "Processing" },
}, { timestamps: true });

const OrderItem = mongoose.model("OrderItem", orderItemSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = { Order, OrderItem };