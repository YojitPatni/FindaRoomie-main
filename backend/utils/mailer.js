const nodemailer = require('nodemailer');

// Configure transporter from environment variables
// Required envs: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE(optional), EMAIL_FROM
// For Gmail OAuth or other providers, adapt accordingly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

async function sendMail({ to, subject, text, html, from }) {
  if (!to) throw new Error('sendMail: "to" is required');
  const mailFrom = from || process.env.EMAIL_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: mailFrom,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    // Do not throw to avoid breaking primary flow
    console.error('Failed to send email:', err?.message || err);
    return null;
  }
}

module.exports = { sendMail };
