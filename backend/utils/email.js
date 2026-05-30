const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"V Shop" <${config.smtp.user}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to V Shop!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Welcome to V Shop!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account with us. We're excited to have you on board!</p>
        <p>Start exploring our collection of premium products.</p>
        <a href="${config.frontendUrl}/shop" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Start Shopping</a>
      </div>
    `
  });
};

const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset - V Shop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Reset Your Password</h1>
        <p>You requested a password reset. Click the button below to reset your password.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
        <p style="margin-top: 16px; color: #6b7280;">This link will expire in 1 hour.</p>
        <p style="color: #6b7280;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
};

const sendOrderConfirmation = async (email, order) => {
  return sendEmail({
    to: email,
    subject: `Order Confirmed #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Order Confirmed!</h1>
        <p>Your order <strong>#${order.id}</strong> has been placed successfully.</p>
        <p>Total: $${order.total_amount}</p>
        <p>We'll notify you when your order ships.</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendResetPasswordEmail, sendOrderConfirmation };
