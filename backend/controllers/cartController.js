const db = require('../config/db');
const { AppError } = require('../utils/errors');

const getCart = async (req, res, next) => {
  try {
    let cartId;
    if (req.user) {
      const carts = await db.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const { sessionId } = req.query;
      if (!sessionId) return res.json({ success: true, data: { items: [], total: 0 } });
      const carts = await db.query('SELECT id FROM cart WHERE session_id = $1', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }

    if (!cartId) return res.json({ success: true, data: { items: [], total: 0 } });

    const items = await db.query(
      `SELECT ci.*, p.name, p.slug, p.price, p.compare_price, p.images, p.stock_quantity,
              pv.name as variant_name, pv.value as variant_value
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    items.forEach(item => {
      item.images = Array.isArray(item.images) ? item.images : (item.images ? JSON.parse(item.images) : []);
      item.image = item.images[0] || '';
    });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ success: true, data: { items, subtotal, total: subtotal } });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1, sessionId } = req.body;

    const products = await db.query(
      'SELECT id, price, stock_quantity, is_active FROM products WHERE id = $1',
      [productId]
    );
    if (!products.length) throw new AppError('Product not found', 404);

    let cartId;
    if (req.user) {
      const carts = await db.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
      if (carts.length) {
        cartId = carts[0].id;
      } else {
        const result = await db.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [req.user.id]);
        cartId = result[0].id;
      }
    } else {
      const carts = await db.query('SELECT id FROM cart WHERE session_id = $1', [sessionId]);
      if (carts.length) {
        cartId = carts[0].id;
      } else {
        const result = await db.query('INSERT INTO cart (session_id) VALUES ($1) RETURNING id', [sessionId]);
        cartId = result[0].id;
      }
    }

    const existing = await db.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3',
      [cartId, productId, variantId || null]
    );

    if (existing.length) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > products[0].stock_quantity) {
        throw new AppError('Not enough stock available', 400);
      }
      await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQty, existing[0].id]);
    } else {
      await db.query(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
        [cartId, productId, variantId || null, quantity]
      );
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);

    const items = await db.query(
      'SELECT ci.product_id, ci.quantity, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = $1',
      [id]
    );
    if (!items.length) throw new AppError('Cart item not found', 404);
    if (quantity > items[0].stock_quantity) throw new AppError('Not enough stock', 400);

    await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, id]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    let cartId;
    if (req.user) {
      const carts = await db.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const { sessionId } = req.body;
      const carts = await db.query('SELECT id FROM cart WHERE session_id = $1', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }
    if (cartId) {
      await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
