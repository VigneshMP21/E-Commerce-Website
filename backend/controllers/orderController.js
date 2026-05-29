const pool = require('../config/db');
const { AppError } = require('../utils/errors');
const { sendOrderConfirmation } = require('../utils/email');
const config = require('../config');

const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddressId, billingAddressId, paymentMethod,
      notes, couponCode, sessionId
    } = req.body;

    let cartId;
    if (req.user) {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE session_id = ?', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }

    if (!cartId) throw new AppError('Cart is empty', 400);

    const [items] = await pool.execute(
      `SELECT ci.*, p.name, p.price, p.images, p.stock_quantity
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (!items.length) throw new AppError('Cart is empty', 400);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 100 ? 0 : 10;
    const taxAmount = subtotal * 0.08;
    let discountAmount = 0;

    if (couponCode) {
      const [coupons] = await pool.execute(
        'SELECT * FROM coupons WHERE code = ? AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)',
        [couponCode]
      );
      if (coupons.length) {
        const coupon = coupons[0];
        if (subtotal >= coupon.min_order_amount) {
          discountAmount = coupon.discount_type === 'percentage'
            ? Math.min(subtotal * (coupon.discount_value / 100), coupon.max_discount || Infinity)
            : coupon.discount_value;
          await pool.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
        }
      }
    }

    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;
    const orderNumber = 'ECW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const [orderResult] = await pool.execute(
      `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method,
        subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
        shipping_address_id, billing_address_id, coupon_code, notes)
       VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, req.user?.id || null, paymentMethod,
        subtotal, shippingCost, taxAmount, discountAmount, totalAmount,
        shippingAddressId, billingAddressId || shippingAddressId, couponCode, notes]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await pool.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.images ? JSON.parse(item.images)[0] : null,
         item.quantity, item.price, item.price * item.quantity]
      );
      await pool.execute('UPDATE products SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ? WHERE id = ?',
        [item.quantity, item.quantity, item.product_id]);
    }

    await pool.execute(
      `INSERT INTO order_tracking (order_id, status, description)
       VALUES (?, 'pending', 'Order placed successfully')`,
      [orderId]
    );

    await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    if (req.user) {
      const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
      if (users.length) {
        sendOrderConfirmation(users[0].email, { id: orderNumber, total_amount: totalAmount });
      }
    }

    res.status(201).json({
      success: true,
      data: { id: orderId, orderNumber, totalAmount }
    });
  } catch (error) {
    next(error);
  }
};

const createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) throw new AppError('Stripe not configured', 500);
    const { orderId } = req.body;

    const [orders] = await pool.execute('SELECT order_number, total_amount FROM orders WHERE id = ?', [orderId]);
    if (!orders.length) throw new AppError('Order not found', 404);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orders[0].total_amount * 100),
      currency: 'inr',
      metadata: { orderId: orderId.toString(), orderNumber: orders[0].order_number }
    });

    await pool.execute(
      'UPDATE orders SET payment_id = ? WHERE id = ?',
      [paymentIntent.id, orderId]
    );

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (error) {
    next(error);
  }
};

const handleStripeWebhook = async (req, res, next) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await pool.execute(
        "UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE payment_id = ?",
        [paymentIntent.id]
      );
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );
    if (!orders.length) throw new AppError('Order not found', 404);

    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );

    const [tracking] = await pool.execute(
      'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
      [orders[0].id]
    );

    res.json({ success: true, data: { ...orders[0], items, tracking } });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const trackingData = {
      confirmed: 'Order confirmed',
      processing: 'Order is being processed',
      shipped: 'Order has been shipped',
      delivered: 'Order delivered successfully',
      cancelled: 'Order cancelled',
      refunded: 'Refund processed'
    };

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    await pool.execute(
      'INSERT INTO order_tracking (order_id, status, description) VALUES (?, ?, ?)',
      [id, status, trackingData[status] || 'Status updated']
    );

    if (status === 'shipped') {
      await pool.execute("UPDATE orders SET shipped_at = NOW() WHERE id = ?", [id]);
    }
    if (status === 'delivered') {
      await pool.execute("UPDATE orders SET delivered_at = NOW() WHERE id = ?", [id]);
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    let sql = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id';
    const params = [];

    if (status) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [orders] = await pool.execute(sql, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder, createPaymentIntent, handleStripeWebhook,
  getUserOrders, getOrderByNumber, updateOrderStatus, getAllOrders
};
