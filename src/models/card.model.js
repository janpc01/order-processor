const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    beltRank: {
        type: String,
        required: true
    },
    achievement: {
        type: String,
        required: true
    },
    clubName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    printCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Card', CardSchema);