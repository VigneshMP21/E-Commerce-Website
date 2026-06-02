const pool = require('../config/db');
const { AppError } = require('../utils/errors');

const REVIEW_IMAGE_MAX_SIZE_MB = 1;
const REVIEW_IMAGE_TOTAL_MAX_SIZE_MB = 3;
const REVIEW_IMAGE_MAX_BYTES = REVIEW_IMAGE_MAX_SIZE_MB * 1024 * 1024;
const REVIEW_IMAGE_TOTAL_MAX_BYTES = REVIEW_IMAGE_TOTAL_MAX_SIZE_MB * 1024 * 1024;
const REVIEW_IMAGE_SIZE_MESSAGE = `Image is not supported because image size must be ${REVIEW_IMAGE_MAX_SIZE_MB} MB or smaller.`;
const REVIEW_IMAGE_TOTAL_SIZE_MESSAGE = `Image is not supported because total review image size must be ${REVIEW_IMAGE_TOTAL_MAX_SIZE_MB} MB or smaller.`;

const getReviewImageByteSize = (image) => {
  const value = String(image || '');
  const base64 = value.startsWith('data:image/') ? value.split(',')[1] : '';

  if (base64) {
    return Buffer.byteLength(base64, 'base64');
  }

  return Buffer.byteLength(value, 'utf8');
};

const getWishlist = async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT w.id as wishlist_id, w.created_at as added_at, p.*
       FROM wishlist w JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    items.forEach(item => {
      item.images = item.images ? JSON.parse(item.images) : [];
    });

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existing.length) {
      await pool.execute('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
      res.json({ success: true, message: 'Removed from wishlist', data: { inWishlist: false } });
    } else {
      await pool.execute(
        'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
        [req.user.id, productId]
      );
      res.json({ success: true, message: 'Added to wishlist', data: { inWishlist: true } });
    }
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images } = req.body;
    const reviewRating = Math.min(Math.max(parseInt(rating, 10) || 0, 1), 5);
    const reviewImages = Array.isArray(images)
      ? images.filter(image => typeof image === 'string' && image.trim()).slice(0, 5)
      : [];
    const reviewImageBytes = reviewImages.map(getReviewImageByteSize);

    if (reviewImageBytes.some(size => size > REVIEW_IMAGE_MAX_BYTES)) {
      throw new AppError(REVIEW_IMAGE_SIZE_MESSAGE, 400);
    }

    if (reviewImageBytes.reduce((total, size) => total + size, 0) > REVIEW_IMAGE_TOTAL_MAX_BYTES) {
      throw new AppError(REVIEW_IMAGE_TOTAL_SIZE_MESSAGE, 400);
    }

    const [imageColumns] = await pool.execute("SHOW COLUMNS FROM reviews LIKE 'images'");
    let supportsReviewImages = imageColumns.length > 0;

    if (!supportsReviewImages && reviewImages.length) {
      try {
        await pool.execute('ALTER TABLE reviews ADD COLUMN images JSON NULL AFTER comment');
        supportsReviewImages = true;
      } catch {
        supportsReviewImages = false;
      }
    }

    const [orders] = await pool.execute(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'`,
      [productId, req.user.id]
    );

    if (!orders.length) {
      throw new AppError('You can review this product after delivery', 400);
    }

    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, req.user.id]
    );

    if (existing.length) {
      if (supportsReviewImages) {
        await pool.execute(
          'UPDATE reviews SET rating = ?, title = ?, comment = ?, images = ?, is_approved = true WHERE id = ?',
          [reviewRating, title || null, comment || null, JSON.stringify(reviewImages), existing[0].id]
        );
      } else {
        await pool.execute(
          'UPDATE reviews SET rating = ?, title = ?, comment = ?, is_approved = true WHERE id = ?',
          [reviewRating, title || null, comment || null, existing[0].id]
        );
      }
    } else {
      if (supportsReviewImages) {
        await pool.execute(
          'INSERT INTO reviews (product_id, user_id, rating, title, comment, images, is_verified_purchase, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [productId, req.user.id, reviewRating, title || null, comment || null, JSON.stringify(reviewImages), true, true]
        );
      } else {
        await pool.execute(
          'INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [productId, req.user.id, reviewRating, title || null, comment || null, true, true]
        );
      }
    }

    const [stats] = await pool.execute(
      'SELECT ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND (is_approved = true OR is_verified_purchase = true)',
      [productId]
    );

    if (stats.length) {
      await pool.execute(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [stats[0].avg_rating, stats[0].count, productId]
      );
    }

    res.status(existing.length ? 200 : 201).json({
      success: true,
      message: existing.length ? 'Review updated successfully' : 'Review submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    const [addresses] = await pool.execute(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (isDefault) {
      await pool.execute('UPDATE addresses SET is_default = false WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await pool.execute(
      'INSERT INTO addresses (user_id, full_name, phone, street, city, state, zip_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, fullName, phone, street, city, state, zipCode, country || 'India', isDefault || false]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (isDefault) {
      await pool.execute('UPDATE addresses SET is_default = false WHERE user_id = ?', [req.user.id]);
    }

    await pool.execute(
      'UPDATE addresses SET full_name = ?, phone = ?, street = ?, city = ?, state = ?, zip_code = ?, country = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [fullName, phone, street, city, state, zipCode, country, isDefault || false, id, req.user.id]
    );

    res.json({ success: true, message: 'Address updated' });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};

const getBanners = async (req, res, next) => {
  try {
    const [banners] = await pool.execute(
      'SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC'
    );
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

const checkWishlist = async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      'SELECT product_id FROM wishlist WHERE user_id = ?',
      [req.user.id]
    );
    const productIds = items.map(i => i.product_id);
    res.json({ success: true, data: productIds });
  } catch (error) {
    next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.is_verified, u.created_at,
        COALESCE(os.order_count, 0) as order_count,
        COALESCE(os.total_spent, 0) as total_spent,
        os.last_order_at
       FROM users u
       LEFT JOIN (
         SELECT user_id, COUNT(*) as order_count,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
          MAX(created_at) as last_order_at
         FROM orders
         GROUP BY user_id
       ) os ON os.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['user']);
    const [totalProducts] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [revenue] = await pool.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'");
    const [recentOrders] = await pool.execute(
      'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5'
    );
    const [lowStock] = await pool.execute(
      'SELECT id, name, stock_quantity, low_stock_threshold FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = true'
    );
    const [ordersByStatus] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );
    const [monthlyRevenue] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders WHERE payment_status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month`
    );

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers[0].count,
        totalProducts: totalProducts[0].count,
        totalOrders: totalOrders[0].count,
        totalRevenue: revenue[0].total,
        recentOrders,
        lowStock,
        ordersByStatus,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist, toggleWishlist, addReview,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getBanners, checkWishlist, getAdminUsers, getDashboardStats
};
