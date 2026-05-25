const router = require('express').Router();
const ctrl = require('../controllers/purchaseOrderController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getPurchaseOrders)
  .post(authorize('admin', 'manager'), ctrl.purchaseOrderRules, validate, ctrl.createPurchaseOrder);

router.route('/:id').get(ctrl.getPurchaseOrder);
router.put('/:id/status', authorize('admin', 'manager'), ctrl.updateStatus);
router.delete('/:id', authorize('admin'), ctrl.deletePurchaseOrder);

module.exports = router;
