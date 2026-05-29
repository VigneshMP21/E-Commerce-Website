const pool = require('../config/db');
const { AppError } = require('../utils/errors');

const getCart = async (req, res, next) => {
  try {
    let cartId;
    if (req.user) {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const { sessionId } = req.query;
      if (!sessionId) return res.json({ success: true, data: { items: [], total: 0 } });
      const [carts] = await pool.execute('SELECT id FROM cart WHERE session_id = ?', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }

    if (!cartId) return res.json({ success: true, data: { items: [], total: 0 } });

    const [items] = await pool.execute(
      `SELECT ci.*, p.name, p.slug, p.price, p.compare_price, p.images, p.stock_quantity,
              pv.name as variant_name, pv.value as variant_value
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    items.forEach(item => {
      item.images = item.images ? JSON.parse(item.images) : [];
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

    const [products] = await pool.execute(
      'SELECT id, price, stock_quantity, is_active FROM products WHERE id = ?',
      [productId]
    );
    if (!products.length) throw new AppError('Product not found', 404);

    let cartId;
    if (req.user) {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
      if (carts.length) {
        cartId = carts[0].id;
      } else {
        const [result] = await pool.execute('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
        cartId = result.insertId;
      }
    } else {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE session_id = ?', [sessionId]);
      if (carts.length) {
        cartId = carts[0].id;
      } else {
        const [result] = await pool.execute('INSERT INTO cart (session_id) VALUES (?)', [sessionId]);
        cartId = result.insertId;
      }
    }

    const [existing] = await pool.execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
      [cartId, productId, variantId, variantId]
    );

    if (existing.length) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > products[0].stock_quantity) {
        throw new AppError('Not enough stock available', 400);
      }
      await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
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

    const [items] = await pool.execute(
      'SELECT ci.product_id, ci.quantity, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ?',
      [id]
    );
    if (!items.length) throw new AppError('Cart item not found', 404);
    if (quantity > items[0].stock_quantity) throw new AppError('Not enough stock', 400);

    await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM cart_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    let cartId;
    if (req.user) {
      const [carts] = await pool.execute('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
      cartId = carts.length ? carts[0].id : null;
    } else {
      const { sessionId } = req.body;
      const [carts] = await pool.execute('SELECT id FROM cart WHERE session_id = ?', [sessionId]);
      cartId = carts.length ? carts[0].id : null;
    }
    if (cartId) {
      await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
