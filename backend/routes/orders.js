const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, orderController.createOrder);
router.post('/create-payment-intent', authenticate, orderController.createPaymentIntent);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), orderController.handleStripeWebhook);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/all', authenticate, authorize('admin'), orderController.getAllOrders);
router.get('/:orderNumber', authenticate, orderController.getOrderByNumber);
router.put('/:id/status', authenticate, authorize('admin'), orderController.updateOrderStatus);

module.exports = router;
