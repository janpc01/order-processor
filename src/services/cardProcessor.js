const puppeteer = require('puppeteer');
const { Order } = require('../models/order.model');
const Card = require('../models/card.model');
const { generateShippingLabel } = require('./shippingLabel');
const { sendPrintFiles } = require('./emailService');
// const Handlebars = require('handlebars').create();
// console.log("This is the Handlebars object:", Handlebars);
// console.log("allowProtoPropertiesByDefault:", Handlebars.allowProtoPropertiesByDefault);
// console.log("allowProtoMethodsByDefault:", Handlebars.allowProtoMethodsByDefault);
const fs = require('fs').promises;
const path = require('path');

// Handlebars.allowProtoPropertiesByDefault = true;
// Handlebars.allowProtoMethodsByDefault = true;

async function processOrder(orderId) {
  const orderDir = path.join(__dirname, '../temp', orderId);
  
  try {
    await fs.mkdir(orderDir, { recursive: true });
    
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

    // Process print sheets and shipping label
    const printSheets = await Promise.all(order.items.map(async (item) => {
      // Increment print count for the ordered card
      await Card.findByIdAndUpdate(item.card._id, { $inc: { printCount: 1 } });
      
      const orderedCard = await generateCard(item.card, orderDir);
      const randomCards = await generateRandomCards(19);
      const randomCardFiles = await Promise.all(
        randomCards.map(card => generateCard(card, orderDir))
      );
      return generatePrintSheet([orderedCard, ...randomCardFiles]);
    }));

    const shippingLabel = await generateShippingLabel(order.shippingAddress, order._id);
    await sendPrintFiles(printSheets, shippingLabel, orderId);

    // Update order status to "Processing"
    await Order.findByIdAndUpdate(orderId, { orderStatus: "Processing" });

  } catch (error) {
    console.error('Order processing failed:', error);
    throw error;
  } finally {
    try {
      await fs.rm(orderDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup temp directory:', cleanupError);
    }
  }
}

// Helper functions for card generation
async function generateCard(cardData, orderDir) {
  try {
    const templatePath = path.join(__dirname, '../templates/cardTemplate.html');
    const template = await fs.readFile(templatePath, 'utf8');
    
    // Transform data to plain object
    const safeCardData = {
      name: cardData.name,
      beltRank: cardData.beltRank,
      achievement: cardData.achievement,
      clubName: cardData.clubName,
      image: cardData.image,
      _id: cardData._id.toString()
    };

    // const compiledTemplate = Handlebars.compile(template);
    // const html = compiledTemplate(safeCardData);
    
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

    // Save to order-specific temp directory
    const cardPath = path.join(orderDir, `card-${cardData._id}.pdf`);
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
    const templatePath = path.join(__dirname, '../templates/printSheetTemplate.html');
    const template = await fs.readFile(templatePath, 'utf8');

    // Transform card contents to plain array
    const safeCardContents = await Promise.all(cardFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'base64');
      return `<embed src="data:application/pdf;base64,${content}" width="100%" height="100%">`;
    }));

    // const compiledTemplate = Handlebars.compile(template);
    // const html = compiledTemplate({ cards: safeCardContents });
    
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