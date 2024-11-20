const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

async function generateShippingLabel(shippingAddress, orderId) {
    try {
        // Read the template
        const templatePath = path.join(__dirname, '../templates/shippingLabelTemplate.html');
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        // Compile the template
        const template = Handlebars.compile(templateContent);
        
        // Prepare the data
        const data = {
            ...shippingAddress,
            orderId
        };
        
        // Generate HTML
        const html = template(data);
        
        // Launch browser
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });
        
        // Create new page
        const page = await browser.newPage();
        
        // Set content
        await page.setContent(html);
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A6',
            printBackground: true,
            margin: {
                top: '0.1in',
                right: '0.1in',
                bottom: '0.1in',
                left: '0.1in'
            }
        });
        
        // Close browser
        await browser.close();
        
        // Create directory for shipping labels if it doesn't exist
        const labelDir = path.join(__dirname, '../temp/shipping-labels');
        await fs.mkdir(labelDir, { recursive: true });
        
        // Save the PDF
        const pdfPath = path.join(labelDir, `shipping-label-${orderId}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);
        
        return pdfPath;
    } catch (error) {
        console.error('Error generating shipping label:', error);
        throw error;
    }
}

module.exports = { generateShippingLabel };