const pool = require('../config/db');
const { AppError } = require('../utils/errors');

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
    const { productId, rating, title, comment } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, req.user.id]
    );
    if (existing.length) {
      throw new AppError('You have already reviewed this product', 400);
    }

    const [orders] = await pool.execute(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'`,
      [productId, req.user.id]
    );

    await pool.execute(
      'INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [productId, req.user.id, rating, title, comment, orders.length > 0, false]
    );

    const [stats] = await pool.execute(
      'SELECT ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND is_approved = true',
      [productId]
    );

    if (stats.length) {
      await pool.execute(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [stats[0].avg_rating, stats[0].count, productId]
      );
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
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
  getBanners, checkWishlist, getDashboardStats
};
