const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * GET /api/reports/inventory
 * Full inventory report with export support.
 */
exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name company')
      .sort({ name: 1 })
      .lean({ virtuals: true });

    const summary = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + p.quantity * p.sellingPrice, 0),
      totalCost: products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0),
      lowStock: products.filter((p) => p.stockStatus === 'low_stock').length,
      outOfStock: products.filter((p) => p.stockStatus === 'out_of_stock').length,
    };

    res.json({ products, summary });
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/sales
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await SalesOrder.find(filter)
      .populate('customer', 'name company')
      .sort({ createdAt: -1 });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      avgOrderValue: orders.length ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length : 0,
    };

    res.json({ orders, summary });
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/purchases
 */
exports.getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name company')
      .sort({ createdAt: -1 });

    const summary = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      avgOrderValue: orders.length ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length : 0,
    };

    res.json({ orders, summary });
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/export/pdf
 * Generates and streams a PDF inventory report.
 */
exports.exportPDF = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name').sort({ name: 1 }).lean({ virtuals: true });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('InnoVentory — Inventory Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table header
    const headers = ['Product', 'SKU', 'Category', 'Qty', 'Cost', 'Price', 'Status'];
    const colWidths = [130, 70, 80, 40, 60, 60, 70];
    let x = 40;
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => { doc.text(h, x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 }); x += colWidths[i]; });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(8);
    products.forEach((p) => {
      if (doc.y > 750) { doc.addPage(); }
      x = 40;
      const row = [p.name, p.sku, p.category?.name || '-', String(p.quantity), `₹${p.costPrice}`, `₹${p.sellingPrice}`, p.stockStatus];
      row.forEach((val, i) => { doc.text(val, x, doc.y, { width: colWidths[i], continued: i < row.length - 1 }); x += colWidths[i]; });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/export/excel
 * Generates and streams an Excel inventory report.
 */
exports.exportExcel = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name').populate('supplier', 'name').sort({ name: 1 }).lean({ virtuals: true });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InnoVentory';
    const sheet = workbook.addWorksheet('Inventory');

    sheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Cost Price (₹)', key: 'costPrice', width: 15 },
      { header: 'Selling Price (₹)', key: 'sellingPrice', width: 15 },
      { header: 'Stock Value (₹)', key: 'stockValue', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, size: 11 };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    products.forEach((p) => {
      sheet.addRow({
        name: p.name, sku: p.sku, category: p.category?.name || '-',
        supplier: p.supplier?.name || '-', quantity: p.quantity,
        costPrice: p.costPrice, sellingPrice: p.sellingPrice,
        stockValue: p.quantity * p.sellingPrice, status: p.stockStatus,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};
