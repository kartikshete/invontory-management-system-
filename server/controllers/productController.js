const Product = require('../models/Product');
const { body } = require('express-validator');

/* ---- Validation ---- */
exports.productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price is required'),
];

/**
 * GET /api/products
 * List products with pagination, search, and filters.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      supplier,
      stockStatus,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name color')
        .populate('supplier', 'name company')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      Product.countDocuments(filter),
    ]);

    // Apply stock status filter in-memory (virtual field)
    let filtered = products;
    if (stockStatus) {
      filtered = products.filter((p) => p.stockStatus === stockStatus);
    }

    res.json({
      products: filtered,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name color')
      .populate('supplier', 'name company phone email')
      .lean({ virtuals: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name color')
      .populate('supplier', 'name company');

    res.status(201).json({ product: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name color')
      .populate('supplier', 'name company');

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id  (soft delete)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/low-stock
 * Returns products at or below their minimum stock level.
 */
exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
    })
      .populate('category', 'name color')
      .populate('supplier', 'name company')
      .sort({ quantity: 1 })
      .lean({ virtuals: true });

    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
};
