const db = require('../config/db');
const supabase = require('../config/supabase');
const { AppError } = require('../utils/errors');

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

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

const sanitizeFileName = (fileName = 'image') => (
  String(fileName)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image'
);

const createStorageFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${timestamp}-${random}-${sanitizeFileName(originalName)}`;
};

const uploadImageToSupabase = async (file) => {
  if (!file?.buffer) {
    throw new AppError('Image file buffer is required', 400);
  }

  const fileName = createStorageFileName(file.originalname);
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new AppError(`Supabase upload failed: ${uploadError.message}`, 500);
  }

  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new AppError('Unable to get uploaded image public URL', 500);
  }

  return {
    url: data.publicUrl,
    filename: fileName,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

const visibleReviewWhere = '(is_approved = true OR is_verified_purchase = true)';
const reviewStatsJoin = `LEFT JOIN (
  SELECT product_id, ROUND(AVG(rating), 2) as average_rating, COUNT(*) as review_total
  FROM reviews
  WHERE ${visibleReviewWhere}
  GROUP BY product_id
) rs ON rs.product_id = p.id`;
const reviewRatingExpr = 'COALESCE(rs.average_rating, p.rating, 0)';
const reviewCountExpr = 'COALESCE(rs.review_total, p.review_count, 0)';

const applyReviewStats = (product) => {
  product.rating = Number(product.computed_rating ?? product.rating ?? 0);
  product.review_count = Number(product.computed_review_count ?? product.review_count ?? 0);
  delete product.computed_rating;
  delete product.computed_review_count;
  return product;
};

const getSearchPatterns = (value = '') => {
  const normalized = String(value).trim();
  if (!normalized) return [];

  const variants = new Set([normalized]);
  const slug = makeSlug(normalized);
  if (slug) variants.add(slug);

  if (normalized.length > 3 && normalized.toLowerCase().endsWith('s')) {
    const singular = normalized.slice(0, -1);
    variants.add(singular);

    const singularSlug = makeSlug(singular);
    if (singularSlug) variants.add(singularSlug);
  }

  return [...variants].map(term => `%${term}%`);
};

const addParam = (params, value) => {
  params.push(value);
  return `$${params.length}`;
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
    let sql = 'SELECT id FROM categories WHERE slug = $1';

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }

    sql += ' LIMIT 1';

    const existingSlug = await db.query(sql, params);
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

    const productJoin = `FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN categories pc ON c.parent_id = pc.id ${reviewStatsJoin}`;
    let sql = `SELECT p.*, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, c.name as category_name, c.slug as category_slug ${productJoin} WHERE p.is_active = true`;
    let countSql = `SELECT COUNT(*) as total ${productJoin} WHERE p.is_active = true`;
    const params = [];
    const countParams = [];

    if (status === 'active') {
      sql += ` AND p.status = ${addParam(params, 'active')}`;
      countSql += ` AND p.status = ${addParam(countParams, 'active')}`;
    }

    if (category) {
      sql += ` AND (c.slug = ${addParam(params, category)} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${addParam(params, category)}))`;
      countSql += ` AND (c.slug = ${addParam(countParams, category)} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${addParam(countParams, category)}))`;
    }

    const searchPatterns = getSearchPatterns(search);
    if (searchPatterns.length) {
      const searchFields = [
        'p.name',
        'p.description',
        'p.short_description',
        'p.brand',
        'p.sku',
        'c.name',
        'c.slug',
        'pc.name',
        'pc.slug'
      ];
      const searchClause = searchPatterns
        .flatMap(pattern => searchFields.map(field => `${field} ILIKE ${addParam(params, pattern)}`))
        .join(' OR ');
      const countSearchClause = searchPatterns
        .flatMap(pattern => searchFields.map(field => `${field} ILIKE ${addParam(countParams, pattern)}`))
        .join(' OR ');

      sql += ` AND (${searchClause})`;
      countSql += ` AND (${countSearchClause})`;
    }

    if (minPrice) {
      sql += ` AND p.price >= ${addParam(params, parseFloat(minPrice))}`;
      countSql += ` AND p.price >= ${addParam(countParams, parseFloat(minPrice))}`;
    }

    if (maxPrice) {
      sql += ` AND p.price <= ${addParam(params, parseFloat(maxPrice))}`;
      countSql += ` AND p.price <= ${addParam(countParams, parseFloat(maxPrice))}`;
    }

    if (rating) {
      sql += ` AND ${reviewRatingExpr} >= ${addParam(params, parseFloat(rating))}`;
      countSql += ` AND ${reviewRatingExpr} >= ${addParam(countParams, parseFloat(rating))}`;
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
      'rating': `${reviewRatingExpr} DESC`,
      'name': 'p.name ASC'
    };
    sql += ' ORDER BY ' + (sortOptions[sort] || 'p.created_at DESC');

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${addParam(params, parseInt(limit))} OFFSET ${addParam(params, offset)}`;

    const products = await db.query(sql, params);
    products.forEach(product => {
      applyReviewStats(product);
      product.images = parseJsonArray(product.images);
      product.specifications = parseJsonArray(product.specifications);
    });

    const countResult = await db.query(countSql, countParams);
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

    const products = await db.query(
      `SELECT p.*, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id ${reviewStatsJoin}
       WHERE p.slug = $1`,
      [slug]
    );

    if (!products.length) {
      throw new AppError('Product not found', 404);
    }

    const product = products[0];
    applyReviewStats(product);
    product.images = parseJsonArray(product.images);
    product.specifications = parseJsonArray(product.specifications);

    const variants = await db.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true',
      [product.id]
    );

    const imageRows = await db.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [product.id]
    );
    const galleryImages = imageRows.length ? imageRows.map(image => image.url) : product.images;

    const reviews = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND (r.is_approved = true OR r.is_verified_purchase = true)
       ORDER BY r.created_at DESC`,
      [product.id]
    );
    reviews.forEach(review => {
      review.images = parseJsonArray(review.images);
    });

    const related = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.images, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count
       FROM products p ${reviewStatsJoin}
       WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
       LIMIT 6`,
      [product.category_id, product.id]
    );

    related.forEach(p => {
      applyReviewStats(p);
      p.images = parseJsonArray(p.images);
    });

    if (req.user) {
      await db.query(
        'INSERT INTO recently_viewed (user_id, product_id) VALUES ($1, $2)',
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

    const result = await db.query(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price,
        category_id, brand, stock_quantity, sku, images, specifications, is_featured, status,
        discount_percent, tax_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`,
      [name, slug, description, shortDescription, price, comparePrice,
        categoryId, brand, stockQuantity, sku,
        images ? JSON.stringify(images) : null,
        specifications ? JSON.stringify(specifications) : null,
        isFeatured || false, status || 'active', discountPercent || 0, taxRate || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result[0].id }
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

    const existingByName = await db.query(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND parent_id IS NOT DISTINCT FROM $2 LIMIT 1',
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

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image, parent_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [trimmedName, slug, description || null, image || null, parentCategoryId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result[0].id,
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

    const categories = await db.query(
      'SELECT * FROM categories WHERE id = $1 LIMIT 1',
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

      const parents = await db.query(
        'SELECT id, parent_id FROM categories WHERE id = $1 AND is_active = true LIMIT 1',
        [nextParentId]
      );

      if (!parents.length) {
        throw new AppError('Parent category not found', 404);
      }

      if (parents[0].parent_id) {
        throw new AppError('Parent category must be a top-level category', 400);
      }

      const children = await db.query(
        'SELECT COUNT(*)::int as total FROM categories WHERE parent_id = $1 AND is_active = true',
        [categoryId]
      );

      if (children[0].total > 0) {
        throw new AppError('Move or delete subcategories before assigning a parent category', 400);
      }
    }

    const duplicates = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND parent_id IS NOT DISTINCT FROM $2 AND id != $3 LIMIT 1',
      [nextName, nextParentId, categoryId]
    );

    if (duplicates.length) {
      throw new AppError('Category already exists', 409);
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push(`name = ${addParam(values, nextName)}`, `slug = ${addParam(values, await getUniqueCategorySlug(nextName, categoryId))}`);
    }

    if (parentId !== undefined) {
      fields.push(`parent_id = ${addParam(values, nextParentId)}`);
    }

    if (description !== undefined) {
      fields.push(`description = ${addParam(values, description || null)}`);
    }

    if (image !== undefined) {
      fields.push(`image = ${addParam(values, image || null)}`);
    }

    if (!fields.length) {
      throw new AppError('No fields to update', 400);
    }

    await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ${addParam(values, categoryId)}`,
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

    const categories = await db.query(
      'SELECT id FROM categories WHERE id = $1 LIMIT 1',
      [categoryId]
    );

    if (!categories.length) {
      throw new AppError('Category not found', 404);
    }

    await db.query('DELETE FROM categories WHERE id = $1', [categoryId]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Image file is required', 400);
    }

    const image = await uploadImageToSupabase(req.file);

    res.status(201).json({
      success: true,
      imageUrl: image.url
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
        fields.push(`${dbField} = ${addParam(values, updates[key])}`);
      }
    }

    if (updates.images) {
      fields.push(`images = ${addParam(values, JSON.stringify(updates.images))}`);
    }

    if (updates.specifications) {
      fields.push(`specifications = ${addParam(values, JSON.stringify(updates.specifications))}`);
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    await db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ${addParam(values, id)}`,
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
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await db.query(
      `SELECT c.*, (SELECT COUNT(*)::int FROM products WHERE category_id = c.id AND is_active = true) as product_count
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
    const products = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.images, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, p.discount_percent
       FROM products p ${reviewStatsJoin}
       WHERE p.is_featured = true AND p.is_active = true AND p.status = 'active'
       ORDER BY RANDOM() LIMIT 8`
    );

    products.forEach(p => {
      applyReviewStats(p);
      p.images = parseJsonArray(p.images);
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
