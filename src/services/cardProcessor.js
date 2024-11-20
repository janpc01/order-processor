const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const { Order } = require('../models/order.model');
const Card = require('../models/card.model');
const { generateShippingLabel } = require('./shippingLabel');
const { sendPrintFiles } = require('./emailService');
const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

async function processOrder(orderId) {
  try {
    // Get order details using the same schema as main application
    const order = await Order.findById(orderId)
      .populate({
        path: 'items',
        populate: {
          path: 'card',
          model: 'Card'
        }
      });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create temporary directory for this order
    const orderDir = path.join(__dirname, '../temp', orderId);
    await fs.mkdir(orderDir, { recursive: true });

    // Process 1: Generate print sheets
    const printSheets = await Promise.all(order.items.map(async (item) => {
      // Process A: Generate ordered card
      const orderedCard = await generateCard(item.card);

      // Process B: Generate random cards
      const randomCards = await generateRandomCards(19);
      const randomCardFiles = await Promise.all(
        randomCards.map(card => generateCard(card))
      );

      // Combine into print sheet
      return generatePrintSheet([orderedCard, ...randomCardFiles]);
    }));

    // Process 2: Generate shipping label
    const shippingLabel = await generateShippingLabel(order.shippingAddress, order._id);

    // Send email with files
    await sendPrintFiles(printSheets, shippingLabel, orderId);

    // Cleanup temporary files
    await fs.rm(orderDir, { recursive: true });

  } catch (error) {
    console.error('Order processing failed:', error);
    throw error;
  }
}

// Helper functions for card generation
async function generateCard(cardData) {
  try {
    // Read card template
    const templatePath = path.join(__dirname, '../templates/cardTemplate.html');
    const template = await fs.readFile(templatePath, 'utf8');

    // Compile template
    const compiledTemplate = Handlebars.compile(template);

    // Generate HTML
    const html = compiledTemplate(cardData);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    // Create new page
    const page = await browser.newPage();
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: '2.5in',
      height: '3.5in',
      printBackground: true
    });

    await browser.close();

    // Save to temporary file
    const cardPath = path.join(__dirname, '../temp', `card-${cardData._id}.pdf`);
    await fs.writeFile(cardPath, pdfBuffer);

    return cardPath;
  } catch (error) {
    console.error('Error generating card:', error);
    throw error;
  }
}

async function generateRandomCards(count) {
  return await Card.aggregate([{ $sample: { size: count } }]);
}

async function generatePrintSheet(cardFiles) {
  try {
    // Read print sheet template
    const templatePath = path.join(__dirname, '../templates/printSheetTemplate.html');
    const template = await fs.readFile(templatePath, 'utf8');

    // Read all card PDFs and convert to base64
    const cardContents = await Promise.all(cardFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'base64');
      return `<embed src="data:application/pdf;base64,${content}" width="100%" height="100%">`;
    }));

    // Compile template
    const compiledTemplate = Handlebars.compile(template);

    // Generate HTML
    const html = compiledTemplate({ cards: cardContents });

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    // Create new page
    const page = await browser.newPage();
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await browser.close();

    // Save to temporary file
    const sheetPath = path.join(__dirname, '../temp', `print-sheet-${Date.now()}.pdf`);
    await fs.writeFile(sheetPath, pdfBuffer);

    // Clean up individual card files
    await Promise.all(cardFiles.map(file => fs.unlink(file)));

    return sheetPath;
  } catch (error) {
    console.error('Error generating print sheet:', error);
    throw error;
  }
}

module.exports = { processOrder };