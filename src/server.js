const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const { processOrder } = require('./services/cardProcessor');
const db = require('./models');

const app = express();
app.use(express.json());

console.log("Starting server with ENV:", process.env);
console.log("Current Working Directory:", process.cwd());
console.log("Loaded Configuration:", __dirname);

// Connect to MongoDB using the models index
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://0.0.0.0:27017/kyoso_db';
console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

db.mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit();
  });

// Endpoint to receive order IDs
app.post('/process-print', async (req, res) => {
  const { orderId } = req.body;
  
  try {
    // Send response immediately
    res.status(200).json({ message: 'Order processing started' });
    
    // Process order asynchronously after response is sent
    processOrder(orderId).catch(error => {
      console.error('Error processing order:', error);
    });
  } catch (error) {
    console.error('Error initiating order process:', error);
    res.status(500).json({ error: 'Failed to initiate order process' });
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Order processor running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});