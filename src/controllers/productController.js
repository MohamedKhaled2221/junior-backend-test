const Product = require('../models/Product');


exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;
    const product = await Product.create({ name, category, price, quantity });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create product.', error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(),
    ]);

    return res.status(200).json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch products.', error: err.message });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json(product);
  } catch (err) {
    // Invalid ObjectId format also lands here (CastError)
    return res.status(400).json({ message: 'Invalid product id.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, quantity },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json(product);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update product.', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid product id.' });
  }
};
