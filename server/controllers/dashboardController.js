const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');

/**
 * GET /api/dashboard
 * Aggregate key metrics for the dashboard view.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel for performance
    const [
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      inventoryValue,
      recentSales,
      recentPurchases,
      monthlySales,
      monthlyPurchases,
      topProducts,
      categoryDistribution,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$minStockLevel'] } }),
      Category.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalCost: { $sum: { $multiply: ['$quantity', '$costPrice'] } }, totalRetail: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } } } },
      ]),
      SalesOrder.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),
      PurchaseOrder.find().sort({ createdAt: -1 }).limit(5).populate('supplier', 'name'),
      SalesOrder.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SalesOrder.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { name: '$category.name', color: '$category.color', count: 1, totalValue: 1 } },
      ]),
    ]);

    const value = inventoryValue[0] || { totalCost: 0, totalRetail: 0 };

    res.json({
      stats: {
        totalProducts, lowStockProducts, totalCategories, totalSuppliers, totalCustomers,
        inventoryValueCost: value.totalCost, inventoryValueRetail: value.totalRetail,
      },
      recentSales,
      recentPurchases,
      charts: { monthlySales, monthlyPurchases, topProducts, categoryDistribution },
    });
  } catch (error) { next(error); }
};
