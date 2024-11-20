require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { processOrder } = require('./services/cardProcessor');

const app = express();
app.use(express.json());

// Connect to the same MongoDB as the main application
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Endpoint to receive order IDs
app.post('/process-print', async (req, res) => {
  const { orderId } = req.body;
  
  try {
    // Process order asynchronously
    processOrder(orderId);
    res.status(200).json({ message: 'Order processing started' });
  } catch (error) {
    console.error('Error initiating order process:', error);
    res.status(500).json({ error: 'Failed to initiate order process' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Order processor running on port ${PORT}`);
});