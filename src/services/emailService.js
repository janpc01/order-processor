const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'janpc01@gmail.com',
    pass: 'rjpg flfu tjpr hsba'
  }
});

const formatOrderSummary = (order) => {
  return order.items.map(item => 
    `Card Details:
    - Name: ${item.card.name}
    - Belt Rank: ${item.card.beltRank}
    - Achievement: ${item.card.achievement}
    - Club Name: ${item.card.clubName}
    - Quantity: ${item.quantity}
    `
  ).join('\n\n');
};

const sendPrintFiles = async (printSheets, shippingLabel, orderId) => {
  try {
    // Prepare attachments
    const attachments = [
      // Shipping label
      {
        filename: `shipping-label-${orderId}.pdf`,
        path: shippingLabel
      },
      // Print sheets
      ...printSheets.map((sheet, index) => ({
        filename: `print-sheet-${index + 1}-${orderId}.pdf`,
        path: sheet
      }))
    ];

    const emailContent = `
      Print Files for Order #${orderId}

      This email contains:
      1. Shipping Label (1 file)
      2. Print Sheets (${printSheets.length} files)

      Total files attached: ${attachments.length}

      Please print all sheets and prepare for shipping.
    `;

    await transporter.sendMail({
      from: 'janpc01@gmail.com',
      to: 'janpc01@gmail.com',
      subject: `Print Files - Order #${orderId}`,
      text: emailContent,
      attachments
    });

    console.log(`Print files sent successfully for order ${orderId}`);
  } catch (error) {
    console.error('Error sending print files:', error);
    throw new Error(`Failed to send print files for order ${orderId}: ${error.message}`);
  }
};

module.exports = { sendPrintFiles };