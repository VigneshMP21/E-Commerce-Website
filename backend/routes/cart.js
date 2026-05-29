const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

router.get('/', optionalAuth, cartController.getCart);
router.post('/', optionalAuth, cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeCartItem);
router.delete('/', optionalAuth, cartController.clearCart);

module.exports = router;
