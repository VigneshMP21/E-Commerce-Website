const { AppError } = require('../utils/errors');
const { sendEmail } = require('../utils/email');

const CONTACT_RECIPIENT_EMAIL = 'mpvignesh2107@gmail.com';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendContactMessage = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const subject = req.body.subject.trim();
    const message = req.body.message.trim();

    const sent = await sendEmail({
      to: CONTACT_RECIPIENT_EMAIL,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
          <h1 style="color: #4f46e5;">New Contact Message</h1>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="margin-top: 20px;">
            <strong>Message:</strong>
            <p style="white-space: pre-line; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>
        </div>
      `
    });

    if (!sent) {
      throw new AppError('Unable to send message. Please try again later.', 500);
    }

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendContactMessage };
