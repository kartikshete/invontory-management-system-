const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getCategories)
  .post(authorize('admin', 'manager'), ctrl.categoryRules, validate, ctrl.createCategory);

router.route('/:id')
  .get(ctrl.getCategory)
  .put(authorize('admin', 'manager'), ctrl.updateCategory)
  .delete(authorize('admin'), ctrl.deleteCategory);

module.exports = router;
