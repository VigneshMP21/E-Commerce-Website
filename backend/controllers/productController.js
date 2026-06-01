const pool = require('../config/db');
const { AppError } = require('../utils/errors');

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

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

const getUniqueCategorySlug = async (name, excludeId = null) => {
  const slugBase = makeSlug(name);
  if (!slugBase) {
    throw new AppError('Category name must contain letters or numbers', 400);
  }

  let slug = slugBase;
  let suffix = 2;

  while (true) {
    const params = [slug];
    let sql = 'SELECT id FROM categories WHERE slug = ?';

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    sql += ' LIMIT 1';

    const [existingSlug] = await pool.execute(sql, params);
    if (!existingSlug.length) break;

    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const getProducts = async (req, res, next) => {
  try {
    const {
      category, search, minPrice, maxPrice,
      rating, sort, page = 1, limit = 12,
      featured, status = 'active'
    } = req.query;

    let sql = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    let countSql = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
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

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, parentId } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const parentCategoryId = parentId ? Number(parentId) : null;

    if (!trimmedName) {
      throw new AppError('Category name is required', 400);
    }

    if (parentId && Number.isNaN(parentCategoryId)) {
      throw new AppError('Valid parent category is required', 400);
    }

    const [existingByName] = await pool.execute(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND parent_id <=> ? LIMIT 1',
      [trimmedName, parentCategoryId]
    );

    if (existingByName.length) {
      return res.json({
        success: true,
        message: 'Category already exists',
        data: existingByName[0]
      });
    }

    const slug = await getUniqueCategorySlug(trimmedName);

    const [result] = await pool.execute(
      `INSERT INTO categories (name, slug, description, image, parent_id, is_active)
       VALUES (?, ?, ?, ?, ?, true)`,
      [trimmedName, slug, description || null, image || null, parentCategoryId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertId,
        name: trimmedName,
        slug,
        description: description || null,
        image: image || null,
        parent_id: parentCategoryId,
        is_active: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const { name, description, image, parentId } = req.body;

    if (Number.isNaN(categoryId)) {
      throw new AppError('Valid category is required', 400);
    }

    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      [categoryId]
    );

    if (!categories.length) {
      throw new AppError('Category not found', 404);
    }

    const currentCategory = categories[0];
    const nextName = name !== undefined ? String(name).trim() : currentCategory.name;
    let nextParentId = currentCategory.parent_id;

    if (!nextName) {
      throw new AppError('Category name is required', 400);
    }

    if (parentId !== undefined) {
      nextParentId = parentId === null || parentId === '' ? null : Number(parentId);

      if (nextParentId !== null && Number.isNaN(nextParentId)) {
        throw new AppError('Valid parent category is required', 400);
      }
    }

    if (nextParentId !== null) {
      if (nextParentId === categoryId) {
        throw new AppError('A category cannot be its own parent', 400);
      }

      const [parents] = await pool.execute(
        'SELECT id, parent_id FROM categories WHERE id = ? AND is_active = true LIMIT 1',
        [nextParentId]
      );

      if (!parents.length) {
        throw new AppError('Parent category not found', 404);
      }

      if (parents[0].parent_id) {
        throw new AppError('Parent category must be a top-level category', 400);
      }

      const [children] = await pool.execute(
        'SELECT COUNT(*) as total FROM categories WHERE parent_id = ? AND is_active = true',
        [categoryId]
      );

      if (children[0].total > 0) {
        throw new AppError('Move or delete subcategories before assigning a parent category', 400);
      }
    }

    const [duplicates] = await pool.execute(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND parent_id <=> ? AND id != ? LIMIT 1',
      [nextName, nextParentId, categoryId]
    );

    if (duplicates.length) {
      throw new AppError('Category already exists', 409);
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?', 'slug = ?');
      values.push(nextName, await getUniqueCategorySlug(nextName, categoryId));
    }

    if (parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(nextParentId);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description || null);
    }

    if (image !== undefined) {
      fields.push('image = ?');
      values.push(image || null);
    }

    if (!fields.length) {
      throw new AppError('No fields to update', 400);
    }

    values.push(categoryId);
    await pool.execute(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    if (Number.isNaN(categoryId)) {
      throw new AppError('Valid category is required', 400);
    }

    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ? LIMIT 1',
      [categoryId]
    );

    if (!categories.length) {
      throw new AppError('Category not found', 404);
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const uploadProductImages = async (req, res, next) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      throw new AppError('At least one image file is required', 400);
    }

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const images = files.map(file => ({
      url: `${hostUrl}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: images
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
  getCategories, getFeaturedProducts, createCategory, updateCategory, deleteCategory,
  uploadProductImages
};
