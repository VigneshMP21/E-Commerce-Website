const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.login);

router.post('/refresh', authController.refreshTokenHandler);
router.post('/google', authController.googleAuth);
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], validate, authController.forgotPassword);

router.post('/verify-reset-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').trim().matches(/^\d{6}$/).withMessage('Valid 6 digit OTP is required')
], validate, authController.verifyResetOtp);

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, authController.resetPassword);

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, upload.single('avatarImage'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Phone is too long'),
  body('avatar').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Avatar URL is too long')
], validate, authController.updateProfile);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, authController.changePassword);

module.exports = router;
