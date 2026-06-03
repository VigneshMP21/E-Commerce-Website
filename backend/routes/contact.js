const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const contactController = require('../controllers/contactController');

router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name is too long'),
  body('email').trim().isEmail().withMessage('Valid email is required').isLength({ max: 255 }).withMessage('Email is too long'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }).withMessage('Subject is too long'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }).withMessage('Message is too long')
], validate, contactController.sendContactMessage);

module.exports = router;
