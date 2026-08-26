import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface ReportData {
  restaurantName: string;
  date: string;
  sales: {
    total: number;
    cash: number;
    card: number;
    upi: number;
    onlineOrders: number;
    posOrders: number;
  };
  inventory: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
}

export class PdfService {
  static generateDailyReport(data: ReportData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text(data.restaurantName, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica').text('Daily Sales & Inventory Report', { align: 'center' });
        doc.fontSize(12).fillColor('gray').text(`Date: ${data.date}`, { align: 'center' });
        doc.moveDown(2);

        // Sales Section
        doc.fillColor('black').fontSize(18).font('Helvetica-Bold').text('Sales Overview');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica');
        const drawRow = (label: string, value: string, yPos?: number) => {
          const y = yPos || doc.y;
          doc.text(label, 50, y, { continued: false });
          doc.text(value, 400, y, { align: 'right' });
        };

        drawRow('Total Sales (Paid):', `Rs. ${data.sales.total.toFixed(2)}`);
        doc.moveDown(0.5);
        drawRow('Cash Payments:', `Rs. ${data.sales.cash.toFixed(2)}`);
        drawRow('UPI Payments:', `Rs. ${data.sales.upi.toFixed(2)}`);
        drawRow('Card Payments:', `Rs. ${data.sales.card.toFixed(2)}`);
        doc.moveDown(0.5);
        drawRow('Online Orders:', `${data.sales.onlineOrders}`);
        drawRow('POS Orders:', `${data.sales.posOrders}`);
        
        doc.moveDown(2);

        // Inventory Section
        // If there's not enough space for the header, add a page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(18).font('Helvetica-Bold').text('Inventory Status', 50, doc.y);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Table Header
        let y = doc.y;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Ingredient', 50, y);
        doc.text('Quantity Available', 400, y, { align: 'right' });
        doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
        doc.moveDown(0.5);

        // Table Rows
        doc.font('Helvetica');
        for (const item of data.inventory) {
          if (doc.y > 700) {
            doc.addPage();
            y = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Ingredient', 50, y);
            doc.text('Quantity Available', 400, y, { align: 'right' });
            doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica');
          }
          
          y = doc.y;
          doc.text(item.name, 50, y);
          doc.text(`${item.quantity.toFixed(2)} ${item.unit}`, 400, y, { align: 'right' });
          doc.moveDown(0.2);
        }

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}
