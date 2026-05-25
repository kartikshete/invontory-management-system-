const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

router.use(protect);

router.get('/inventory', ctrl.getInventoryReport);
router.get('/sales', ctrl.getSalesReport);
router.get('/purchases', ctrl.getPurchaseReport);
router.get('/export/pdf', authorize('admin', 'manager'), ctrl.exportPDF);
router.get('/export/excel', authorize('admin', 'manager'), ctrl.exportExcel);

module.exports = router;
