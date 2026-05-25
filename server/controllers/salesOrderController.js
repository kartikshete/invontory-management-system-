const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { body } = require('express-validator');

exports.salesOrderRules = [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
];

exports.getSalesOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customer } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SalesOrder.find(filter)
        .populate('customer', 'name company')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      SalesOrder.countDocuments(filter),
    ]);

    res.json({ orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

exports.getSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer').populate('items.product', 'name sku').populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ error: 'Sales order not found.' });
    res.json({ order });
  } catch (error) { next(error); }
};

exports.createSalesOrder = async (req, res, next) => {
  try {
    const { customer, items, tax = 0, discount = 0, notes, shippingAddress } = req.body;

    // Validate stock availability before creating order
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ error: `Product ${item.productName} not found.` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        });
      }
    }

    const processedItems = items.map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal + tax - discount;

    const order = await SalesOrder.create({
      customer, items: processedItems, subtotal, tax, discount, totalAmount,
      notes, shippingAddress, createdBy: req.user.id,
    });

    // Deduct stock and update customer stats
    const bulkOps = processedItems.map((item) => ({
      updateOne: { filter: { _id: item.product }, update: { $inc: { quantity: -item.quantity } } },
    }));
    await Product.bulkWrite(bulkOps);
    await Customer.findByIdAndUpdate(customer, {
      $inc: { totalOrders: 1, totalSpent: totalAmount },
    });

    const populated = await SalesOrder.findById(order._id)
      .populate('customer', 'name company').populate('createdBy', 'name');
    res.status(201).json({ order: populated });
  } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sales order not found.' });

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const bulkOps = order.items.map((item) => ({
        updateOne: { filter: { _id: item.product }, update: { $inc: { quantity: item.quantity } } },
      }));
      await Product.bulkWrite(bulkOps);
    }

    if (status === 'delivered') order.deliveredDate = new Date();
    order.status = status;
    await order.save();
    res.json({ order });
  } catch (error) { next(error); }
};

exports.deleteSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sales order not found.' });
    if (order.status !== 'draft') return res.status(400).json({ error: 'Only draft orders can be deleted.' });

    // Restore stock for draft deletion
    const bulkOps = order.items.map((item) => ({
      updateOne: { filter: { _id: item.product }, update: { $inc: { quantity: item.quantity } } },
    }));
    await Product.bulkWrite(bulkOps);
    await order.deleteOne();
    res.json({ message: 'Sales order deleted successfully.' });
  } catch (error) { next(error); }
};
