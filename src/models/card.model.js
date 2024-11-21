const mongoose = require('mongoose');

// Define a schema for cards
const cardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    beltRank: { type: String, required: true },
    achievement: { type: String, required: true },
    clubName: { type: String, required: true },
    image: { type: String, required: true },
    price: {
        type: Number,
        default: 24.99
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    printCount: { type: Number, default: 0 }
}, { timestamps: true });


// Create the Card model
const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
