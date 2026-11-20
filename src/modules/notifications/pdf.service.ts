import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface DrinkReportItem {
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  sold?: number;
  restocked?: number;
}

export interface ReportData {
  restaurantName: string;
  date: string;
  shiftTitle?: string;
  sales: {
    total: number;
    cash: number;
    card: number;
    upi: number;
    onlineOrders: number;
    posOrders: number;
  };
  drinksInventory?: DrinkReportItem[];
  inventory?: Array<{
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
        doc.fontSize(22).font('Helvetica-Bold').text(data.restaurantName, { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(15).font('Helvetica-Bold').fillColor('#EA580C').text(data.shiftTitle || 'Sales & Inventory Report', { align: 'center' });
        doc.fontSize(11).font('Helvetica').fillColor('gray').text(`Period: ${data.date}`, { align: 'center' });
        doc.moveDown(1.5);

        // Sales Section
        doc.fillColor('black').fontSize(16).font('Helvetica-Bold').text('Shift Sales Overview');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.8);

        doc.fontSize(13).font('Helvetica');
        const drawRow = (label: string, value: string, boldVal: boolean = false) => {
          const y = doc.y;
          doc.font('Helvetica').text(label, 50, y, { continued: false });
          if (boldVal) doc.font('Helvetica-Bold');
          doc.text(value, 400, y, { align: 'right' });
          doc.font('Helvetica');
        };

        drawRow('Total Sales (Paid):', `Rs. ${data.sales.total.toFixed(2)}`, true);
        doc.moveDown(0.4);
        drawRow('Cash Payments:', `Rs. ${data.sales.cash.toFixed(2)}`);
        drawRow('UPI Payments:', `Rs. ${data.sales.upi.toFixed(2)}`);
        drawRow('Card Payments:', `Rs. ${data.sales.card.toFixed(2)}`);
        doc.moveDown(0.4);
        drawRow('Online Orders:', `${data.sales.onlineOrders}`);
        drawRow('POS Orders:', `${data.sales.posOrders}`);
        drawRow('Total Orders:', `${data.sales.onlineOrders + data.sales.posOrders}`, true);

        doc.moveDown(1.5);

        // Drinks Inventory Section (From Drinks Tab)
        if (data.drinksInventory && data.drinksInventory.length > 0) {
          if (doc.y > 600) doc.addPage();

          doc.fillColor('#C2410C').fontSize(16).font('Helvetica-Bold').text('Drinks & Beverages Inventory (Drinks Tab)');
          doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#C2410C').stroke();
          doc.strokeColor('black');
          doc.moveDown(0.8);

          // Table Header
          let y = doc.y;
          doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
          doc.text('Drink Name', 50, y);
          doc.text('Category', 220, y);
          doc.text('Shift Activity', 330, y);
          doc.text('Current Stock', 440, y, { align: 'right' });
          doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
          doc.moveDown(0.4);

          doc.font('Helvetica');
          for (const d of data.drinksInventory) {
            if (doc.y > 710) {
              doc.addPage();
              y = doc.y;
              doc.fontSize(11).font('Helvetica-Bold');
              doc.text('Drink Name', 50, y);
              doc.text('Category', 220, y);
              doc.text('Shift Activity', 330, y);
              doc.text('Current Stock', 440, y, { align: 'right' });
              doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
              doc.moveDown(0.4);
              doc.font('Helvetica');
            }

            y = doc.y;
            const soldText = d.sold ? `-${d.sold} sold` : '';
            const inText = d.restocked ? `+${d.restocked} in` : '';
            const actText = [soldText, inText].filter(Boolean).join(', ') || '-';

            const qtyNum = Number(d.currentStock || 0);
            const isZero = qtyNum <= 0;

            doc.fontSize(10);
            doc.text(d.name, 50, y, { width: 165 });
            doc.text(d.category || 'Drinks', 220, y, { width: 105 });
            doc.text(actText, 330, y, { width: 105 });
            if (isZero) doc.fillColor('red').font('Helvetica-Bold');
            doc.text(`${qtyNum} ${d.unit || 'btl'}`, 440, y, { align: 'right' });
            doc.fillColor('black').font('Helvetica');
            doc.moveDown(0.2);
          }

          doc.moveDown(1.5);
        }

        // Kitchen Ingredients Section
        if (data.inventory && data.inventory.length > 0) {
          if (doc.y > 600) doc.addPage();

          doc.fillColor('black').fontSize(16).font('Helvetica-Bold').text('Kitchen Ingredients Inventory');
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.8);

          // Table Header
          let y = doc.y;
          doc.fontSize(11).font('Helvetica-Bold');
          doc.text('Ingredient', 50, y);
          doc.text('Current Available', 400, y, { align: 'right' });
          doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
          doc.moveDown(0.4);

          doc.font('Helvetica');
          for (const item of data.inventory) {
            if (doc.y > 710) {
              doc.addPage();
              y = doc.y;
              doc.font('Helvetica-Bold');
              doc.text('Ingredient', 50, y);
              doc.text('Current Available', 400, y, { align: 'right' });
              doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
              doc.moveDown(0.4);
              doc.font('Helvetica');
            }

            y = doc.y;
            doc.fontSize(10);
            doc.text(item.name, 50, y);
            const qtyNum = Number(item.quantity);
            const qtyStr = isNaN(qtyNum) ? '0.00' : qtyNum.toFixed(2);
            doc.text(`${qtyStr} ${item.unit || 'unit'}`, 400, y, { align: 'right' });
            doc.moveDown(0.2);
          }
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
