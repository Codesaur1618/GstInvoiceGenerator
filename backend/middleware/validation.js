const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Invoice validation rules
const validateInvoice = [
  body('invoice_number')
    .notEmpty()
    .withMessage('Invoice number is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invoice number must be between 1 and 50 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  
  body('seller_name')
    .custom((value, { req }) => {
      // For format3, seller_name is not required as it's fixed
      if (req.body.invoice_format === 'format3') {
        return true;
      }
      // For other formats, seller_name is required
      if (!value || value.trim().length === 0) {
        throw new Error('Seller name is required');
      }
      if (value.length > 255) {
        throw new Error('Seller name must be between 1 and 255 characters');
      }
      return true;
    }),
  
  body('buyer_name')
    .notEmpty()
    .withMessage('Buyer name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Buyer name must be between 1 and 255 characters'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.description')
    .notEmpty()
    .withMessage('Item description is required'),
  
  body('items.*.qty')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  
  body('items.*.rate')
    .isNumeric()
    .withMessage('Rate must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rate must be greater than or equal to 0'),
  
  validateRequest
];

// Invoice ID validation
const validateInvoiceId = [
  param('id')
    .isUUID()
    .withMessage('Invalid invoice ID format'),
  validateRequest
];

// Pagination validation
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validateRequest
];

module.exports = {
  validateInvoice,
  validateInvoiceId,
  validatePagination,
  validateRequest
};
