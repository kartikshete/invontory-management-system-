const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const { body } = require('express-validator');

exports.purchaseOrderRules = [
  body('supplier').notEmpty().withMessage('Supplier is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
];

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, supplier } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('supplier', 'name company')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments(filter),
    ]);

    res.json({ orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

exports.getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier').populate('items.product', 'name sku').populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ error: 'Purchase order not found.' });
    res.json({ order });
  } catch (error) { next(error); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items, tax = 0, discount = 0, notes, expectedDelivery } = req.body;
    const processedItems = items.map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal + tax - discount;

    const order = await PurchaseOrder.create({
      supplier, items: processedItems, subtotal, tax, discount, totalAmount,
      notes, expectedDelivery, createdBy: req.user.id,
    });

    const populated = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name company').populate('createdBy', 'name');
    res.status(201).json({ order: populated });
  } catch (error) { next(error); }
};

/** When status changes to "received", auto-increase product quantities */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Purchase order not found.' });

    if (status === 'received' && order.status !== 'received') {
      const bulkOps = order.items.map((item) => ({
        updateOne: { filter: { _id: item.product }, update: { $inc: { quantity: item.quantity } } },
      }));
      await Product.bulkWrite(bulkOps);
      order.receivedDate = new Date();
    }

    order.status = status;
    await order.save();
    res.json({ order });
  } catch (error) { next(error); }
};

exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Purchase order not found.' });
    if (order.status !== 'draft') return res.status(400).json({ error: 'Only draft orders can be deleted.' });
    await order.deleteOne();
    res.json({ message: 'Purchase order deleted successfully.' });
  } catch (error) { next(error); }
};
