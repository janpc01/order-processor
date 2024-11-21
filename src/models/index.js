const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.Order = require('./order.model').Order;
db.OrderItem = require('./order.model').OrderItem;
db.Card = require('./card.model');

module.exports = db;