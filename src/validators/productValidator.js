const { body } = require('express-validator');

const productValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required.')
    .bail()
    .isString()
    .withMessage('Name must be a string.'),

  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string.'),

  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .bail()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number.'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .bail()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer.'),
];

module.exports = productValidationRules;
