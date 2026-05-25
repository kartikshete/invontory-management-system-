const Category = require('../models/Category');
const Product = require('../models/Product');
const { body } = require('express-validator');

exports.categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

/**
 * GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('productCount')
      .sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 */
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('productCount');
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    // Prevent deletion if category has active products
    const productCount = await Product.countDocuments({
      category: req.params.id,
      isActive: true,
    });

    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete — ${productCount} active product(s) belong to this category.`,
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
