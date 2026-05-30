const pool = require('../config/db');
const { AppError } = require('../utils/errors');

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getProducts = async (req, res, next) => {
  try {
    const {
      category, search, minPrice, maxPrice,
      rating, sort, page = 1, limit = 12,
      featured, status = 'active'
    } = req.query;

    let sql = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    let countSql = 'SELECT COUNT(*) as total FROM products p WHERE p.is_active = true';
    const params = [];
    const countParams = [];

    if (status === 'active') {
      sql += ' AND p.status = ?';
      countSql += ' AND p.status = ?';
      params.push('active');
      countParams.push('active');
    }

    if (category) {
      sql += ' AND (c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))';
      countSql += ' AND (c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))';
      params.push(category, category);
      countParams.push(category, category);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countSql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      sql += ' AND p.price >= ?';
      countSql += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
      countParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ' AND p.price <= ?';
      countSql += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
      countParams.push(parseFloat(maxPrice));
    }

    if (rating) {
      sql += ' AND p.rating >= ?';
      countSql += ' AND p.rating >= ?';
      params.push(parseFloat(rating));
      countParams.push(parseFloat(rating));
    }

    if (featured === 'true') {
      sql += ' AND p.is_featured = true';
      countSql += ' AND p.is_featured = true';
    }

    const sortOptions = {
      'price_asc': 'p.price ASC',
      'price_desc': 'p.price DESC',
      'newest': 'p.created_at DESC',
      'popular': 'p.sales_count DESC',
      'rating': 'p.rating DESC',
      'name': 'p.name ASC'
    };
    sql += ' ORDER BY ' + (sortOptions[sort] || 'p.created_at DESC');

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await pool.execute(sql, params);
    products.forEach(product => {
      product.images = parseJsonArray(product.images);
      product.specifications = parseJsonArray(product.specifications);
    });

    const [countResult] = await pool.execute(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [slug]
    );

    if (!products.length) {
      throw new AppError('Product not found', 404);
    }

    const product = products[0];
    product.images = parseJsonArray(product.images);
    product.specifications = parseJsonArray(product.specifications);

    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? AND is_active = true',
      [product.id]
    );

    const [imageRows] = await pool.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [product.id]
    );
    const galleryImages = imageRows.length ? imageRows.map(image => image.url) : product.images;

    const [reviews] = await pool.execute(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [product.id]
    );

    const [related] = await pool.execute(
      `SELECT id, name, slug, price, compare_price, images, rating, review_count
       FROM products WHERE category_id = ? AND id != ? AND is_active = true
       LIMIT 6`,
      [product.category_id, product.id]
    );

    related.forEach(p => {
      p.images = p.images ? JSON.parse(p.images) : [];
    });

    if (req.user) {
      await pool.execute(
        'INSERT INTO recently_viewed (user_id, product_id) VALUES (?, ?)',
        [req.user.id, product.id]
      );
    }

    res.json({
      success: true,
      data: { ...product, images: galleryImages, imageRecords: imageRows, variants, reviews, related }
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name, slug, description, shortDescription, price, comparePrice,
      categoryId, brand, stockQuantity, sku, images, specifications,
      isFeatured, status, discountPercent, taxRate
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price,
        category_id, brand, stock_quantity, sku, images, specifications, is_featured, status,
        discount_percent, tax_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, shortDescription, price, comparePrice,
        categoryId, brand, stockQuantity, sku,
        images ? JSON.stringify(images) : null,
        specifications ? JSON.stringify(specifications) : null,
        isFeatured || false, status || 'active', discountPercent || 0, taxRate || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name', description: 'description', shortDescription: 'short_description',
      price: 'price', comparePrice: 'compare_price', categoryId: 'category_id',
      brand: 'brand', stockQuantity: 'stock_quantity', sku: 'sku',
      isFeatured: 'is_featured', status: 'status', discountPercent: 'discount_percent',
      taxRate: 'tax_rate'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }

    if (updates.images) {
      fields.push('images = ?');
      values.push(JSON.stringify(updates.images));
    }

    if (updates.specifications) {
      fields.push('specifications = ?');
      values.push(JSON.stringify(updates.specifications));
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(id);
    await pool.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.execute(
      `SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = true) as product_count
       FROM categories c WHERE c.is_active = true ORDER BY c.name`
    );

    const parentCategories = categories.filter(c => !c.parent_id);
    const childCategories = categories.filter(c => c.parent_id);

    const result = parentCategories.map(parent => ({
      ...parent,
      subcategories: childCategories.filter(c => c.parent_id === parent.id)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const [products] = await pool.execute(
      `SELECT id, name, slug, price, compare_price, images, rating, review_count, discount_percent
       FROM products WHERE is_featured = true AND is_active = true AND status = 'active'
       ORDER BY RAND() LIMIT 8`
    );

    products.forEach(p => {
      p.images = p.images ? JSON.parse(p.images) : [];
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct,
  getCategories, getFeaturedProducts
};
