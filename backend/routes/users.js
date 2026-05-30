const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin', authenticate, authorize('admin'), userController.getAdminUsers);

router.get('/wishlist', authenticate, userController.getWishlist);
router.get('/wishlist/ids', authenticate, userController.checkWishlist);
router.post('/wishlist', authenticate, userController.toggleWishlist);

router.post('/reviews', authenticate, userController.addReview);

router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, userController.addAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);

router.get('/banners', userController.getBanners);
router.get('/dashboard', authenticate, authorize('admin'), userController.getDashboardStats);

module.exports = router;
