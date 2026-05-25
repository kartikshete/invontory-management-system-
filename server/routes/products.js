const router = require('express').Router();
const ctrl = require('../controllers/productController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/low-stock', ctrl.getLowStock);
router.route('/')
  .get(ctrl.getProducts)
  .post(authorize('admin', 'manager'), ctrl.productRules, validate, ctrl.createProduct);

router.route('/:id')
  .get(ctrl.getProduct)
  .put(authorize('admin', 'manager'), ctrl.updateProduct)
  .delete(authorize('admin'), ctrl.deleteProduct);

module.exports = router;
