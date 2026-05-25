const router = require('express').Router();
const ctrl = require('../controllers/salesOrderController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getSalesOrders)
  .post(authorize('admin', 'manager'), ctrl.salesOrderRules, validate, ctrl.createSalesOrder);

router.route('/:id').get(ctrl.getSalesOrder);
router.put('/:id/status', authorize('admin', 'manager'), ctrl.updateStatus);
router.delete('/:id', authorize('admin'), ctrl.deleteSalesOrder);

module.exports = router;
