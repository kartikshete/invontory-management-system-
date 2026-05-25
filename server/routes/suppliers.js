const router = require('express').Router();
const ctrl = require('../controllers/supplierController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getSuppliers)
  .post(authorize('admin', 'manager'), ctrl.supplierRules, validate, ctrl.createSupplier);

router.route('/:id')
  .get(ctrl.getSupplier)
  .put(authorize('admin', 'manager'), ctrl.updateSupplier)
  .delete(authorize('admin'), ctrl.deleteSupplier);

module.exports = router;
