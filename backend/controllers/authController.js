const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../utils/email');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    );

    const userId = result[0].id;
    const token = generateToken({ id: userId, role: 'user' });
    const refreshToken = generateRefreshToken({ id: userId });

    sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, refreshToken, user: { id: userId, name, email, role: 'user' } }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const users = await db.query(
      'SELECT id, name, email, password, role, avatar, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (!users.length) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = users[0];
    if (!user.password) {
      throw new AppError('Please login with Google', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.is_verified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const newToken = generateToken({ id: decoded.id, role: decoded.role });
    const newRefreshToken = generateRefreshToken({ id: decoded.id });

    res.json({
      success: true,
      data: { token: newToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, role, avatar, phone, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!users.length) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar } = req.body;

    const users = await db.query(
      'SELECT id, name, email, role, avatar, phone, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!users.length) {
      throw new AppError('User not found', 404);
    }

    const currentUser = users[0];
    const nextName = typeof name === 'string' && name.trim() ? name.trim() : currentUser.name;
    const nextEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : currentUser.email;
    const nextPhone = typeof phone === 'string' ? (phone.trim() || null) : currentUser.phone;
    const nextAvatar = typeof avatar === 'string' ? (avatar.trim() || null) : currentUser.avatar;

    if (nextEmail !== currentUser.email) {
      const existingEmail = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [nextEmail, req.user.id]
      );

      if (existingEmail.length) {
        throw new AppError('Email already registered', 409);
      }
    }

    await db.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, avatar = $4 WHERE id = $5',
      [nextName, nextEmail, nextPhone, nextAvatar, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...currentUser,
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        avatar: nextAvatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const users = await db.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!users.length) {
      throw new AppError('User not found', 404);
    }

    if (!users[0].password) {
      throw new AppError('Password change is not available for Google login accounts', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const users = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (!users.length) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 3600000);

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [hashedToken, expires, users[0].id]
    );

    await sendResetPasswordEmail(email, resetToken);

    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const users = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (!users.length) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, users[0].id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    let users = await db.query('SELECT id, role FROM users WHERE email = $1', [email]);

    if (users.length) {
      await db.query('UPDATE users SET google_id = $1, avatar = COALESCE($2, avatar) WHERE id = $3',
        [googleId, avatar, users[0].id]);
    } else {
      const result = await db.query(
        'INSERT INTO users (name, email, google_id, avatar, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id',
        [name, email, googleId, avatar]
      );
      users = [{ id: result[0].id, role: 'user' }];
    }

    const token = generateToken({ id: users[0].id, role: users[0].role });
    const refreshToken = generateRefreshToken({ id: users[0].id });

    res.json({
      success: true,
      data: { token, refreshToken, user: { id: users[0].id, name, email, role: users[0].role, avatar } }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, refreshTokenHandler,
  getProfile, updateProfile, changePassword,
  forgotPassword, resetPassword, googleAuth
};
