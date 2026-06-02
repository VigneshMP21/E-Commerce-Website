const db = require('../config/db');
const { AppError } = require('../utils/errors');
const { sendOrderConfirmation } = require('../utils/email');
const config = require('../config');

const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;

const syncDeliveredOrderPayments = async () => {
  await db.query(
    "UPDATE orders SET payment_status = 'paid' WHERE status = 'delivered' AND (payment_status IS NULL OR payment_status != 'paid')"
  );
};

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

const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddressId, billingAddressId, paymentMethod,
      notes, couponCode, sessionId
    } = req.body;
    const shippingId = shippingAddressId || null;
    const billingId = billingAddressId || shippingId;
    const orderPaymentMethod = paymentMethod || null;
    const orderNotes = notes || null;
    const orderCouponCode = couponCode || null;

    let cartId;
    if (req.user) {
      const carts = await db.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const carts = await db.query('SELECT id FROM cart WHERE session_id = $1', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }

    if (!cartId) throw new AppError('Cart is empty', 400);

    const items = await db.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock_quantity
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (!items.length) throw new AppError('Cart is empty', 400);
    if (!shippingId) throw new AppError('Shipping address is required', 400);
    if (!orderPaymentMethod) throw new AppError('Payment method is required', 400);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 100 ? 0 : 10;
    const taxAmount = subtotal * 0.08;
    let discountAmount = 0;

    if (orderCouponCode) {
      const coupons = await db.query(
        'SELECT * FROM coupons WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)',
        [orderCouponCode]
      );
      if (coupons.length) {
        const coupon = coupons[0];
        if (subtotal >= coupon.min_order_amount) {
          discountAmount = coupon.discount_type === 'percentage'
            ? Math.min(subtotal * (coupon.discount_value / 100), coupon.max_discount || Infinity)
            : coupon.discount_value;
          await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [coupon.id]);
        }
      }
    }

    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;
    const orderNumber = 'ECW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const orderResult = await db.query(
      `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method,
        subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
        shipping_address_id, billing_address_id, coupon_code, notes)
       VALUES ($1, $2, 'pending', 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [orderNumber, req.user?.id || null, orderPaymentMethod,
        subtotal, shippingCost, taxAmount, discountAmount, totalAmount,
        shippingId, billingId, orderCouponCode, orderNotes]
    );

    const orderId = orderResult[0].id;

    for (const item of items) {
      const productImage = parseJsonArray(item.images)[0] || null;

      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.name, productImage,
         item.quantity, item.price, item.price * item.quantity]
      );
      await db.query('UPDATE products SET stock_quantity = stock_quantity - $1, sales_count = sales_count + $2 WHERE id = $3',
        [item.quantity, item.quantity, item.product_id]);
    }

    await db.query(
      `INSERT INTO order_tracking (order_id, status, description)
       VALUES ($1, 'pending', 'Order placed successfully')`,
      [orderId]
    );

    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    if (req.user) {
      const users = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
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

    const orders = await db.query('SELECT order_number, total_amount FROM orders WHERE id = $1', [orderId]);
    if (!orders.length) throw new AppError('Order not found', 404);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orders[0].total_amount * 100),
      currency: 'inr',
      metadata: { orderId: orderId.toString(), orderNumber: orders[0].order_number }
    });

    await db.query(
      'UPDATE orders SET payment_id = $1 WHERE id = $2',
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
      await db.query(
        "UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE payment_id = $1",
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
    const orders = await db.query(
      `SELECT o.*, latest_tracking.created_at as status_updated_at
       FROM orders o
       LEFT JOIN (
         SELECT order_id, MAX(created_at) as created_at
         FROM order_tracking
         GROUP BY order_id
       ) latest_tracking ON latest_tracking.order_id = o.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    if (!orders.length) {
      return res.json({ success: true, data: [] });
    }

    const orderIds = orders.map(order => order.id);
    const items = await db.query(
      `SELECT oi.*, p.slug as product_slug, r.rating as user_rating, r.comment as user_review_comment
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN reviews r ON r.product_id = oi.product_id AND r.user_id = $1
       WHERE oi.order_id = ANY($2::int[])
       ORDER BY oi.id ASC`,
      [req.user.id, orderIds]
    );

    const itemsByOrder = items.reduce((grouped, item) => {
      const orderItems = grouped.get(item.order_id) || [];
      orderItems.push(item);
      grouped.set(item.order_id, orderItems);
      return grouped;
    }, new Map());

    orders.forEach(order => {
      order.items = itemsByOrder.get(order.id) || [];
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const orders = await db.query(
      `SELECT * FROM orders WHERE order_number = $1`,
      [orderNumber]
    );
    if (!orders.length) throw new AppError('Order not found', 404);

    const items = await db.query(
      `SELECT oi.*, p.slug as product_slug, r.rating as user_rating, r.comment as user_review_comment
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN reviews r ON r.product_id = oi.product_id AND r.user_id = $1
       WHERE oi.order_id = $2
       ORDER BY oi.id ASC`,
      [req.user.id, orders[0].id]
    );

    const tracking = await db.query(
      'SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY created_at ASC',
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

    const orderUpdates = ['status = $1'];
    const orderParams = [status];

    if (status === 'delivered') {
      orderUpdates.push("payment_status = 'paid'", 'delivered_at = COALESCE(delivered_at, NOW())');
    }

    if (status === 'shipped') {
      orderUpdates.push('shipped_at = COALESCE(shipped_at, NOW())');
    }

    await db.query(
      `UPDATE orders SET ${orderUpdates.join(', ')} WHERE id = $2`,
      [...orderParams, id]
    );
    await db.query(
      'INSERT INTO order_tracking (order_id, status, description) VALUES ($1, $2, $3)',
      [id, status, trackingData[status] || 'Status updated']
    );

    res.json({
      success: true,
      message: 'Order status updated',
      data: {
        status,
        paymentStatus: status === 'delivered' ? 'paid' : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    await syncDeliveredOrderPayments();

    let sql = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id';
    const params = [];

    if (status) {
      sql += ' WHERE o.status = $1';
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const orders = await db.query(sql, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder, createPaymentIntent, handleStripeWebhook,
  getUserOrders, getOrderByNumber, updateOrderStatus, getAllOrders
};
