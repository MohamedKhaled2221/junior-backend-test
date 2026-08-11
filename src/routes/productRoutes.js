const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');
const productValidationRules = require('../validators/productValidator');
const handleValidationErrors = require('../middleware/handleValidationErrors');

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

//
router.get('/', getProducts);


router.get('/:id', getProductById);


router.post('/', authenticate, authorizeAdmin, productValidationRules, handleValidationErrors, createProduct);

router.put('/:id', authenticate, authorizeAdmin, productValidationRules, handleValidationErrors, updateProduct);

router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

module.exports = router;
