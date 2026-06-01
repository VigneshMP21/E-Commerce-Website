const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/:slug', optionalAuth, productController.getProductBySlug);

router.post('/categories', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], validate, productController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty().withMessage('Category name is required')
], validate, productController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), productController.deleteCategory);

router.post('/images', authenticate, authorize('admin'), upload.array('images', 12), productController.uploadProductImages);

router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('slug').trim().notEmpty().withMessage('Slug is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
], validate, productController.createProduct);

router.put('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router;
