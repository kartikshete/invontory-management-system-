const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(ctrl.getCustomers)
  .post(authorize('admin', 'manager'), ctrl.customerRules, validate, ctrl.createCustomer);

router.route('/:id')
  .get(ctrl.getCustomer)
  .put(authorize('admin', 'manager'), ctrl.updateCustomer)
  .delete(authorize('admin'), ctrl.deleteCustomer);

module.exports = router;
