const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP not configured; emails will be logged only.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    logger.info(`[EMAIL stub] to=${to} subject=${subject}`);
    return { stub: true };
  }
  const info = await t.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@hotel.dev',
    to,
    subject,
    html,
    text,
  });
  logger.info(`Email sent: ${info.messageId} -> ${to}`);
  return info;
}

// ----- Templates --------------------------------------------------------------
const base = (title, body) => `
<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f6fa;padding:24px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <h2 style="color:#0f766e;margin:0 0 16px">${title}</h2>
    ${body}
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    <p style="color:#888;font-size:12px">Hotel Booking System &copy; ${new Date().getFullYear()}</p>
  </div>
</body></html>`;

exports.sendMail = sendMail;

exports.sendVerifyEmail = (to, link) =>
  sendMail({
    to,
    subject: 'Verify your email',
    html: base(
      'Welcome aboard!',
      `<p>Please verify your email by clicking the link below:</p>
       <p><a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify email</a></p>
       <p>If the button does not work, paste this URL: <br/><code>${link}</code></p>`
    ),
  });

exports.sendResetPassword = (to, link) =>
  sendMail({
    to,
    subject: 'Reset your password',
    html: base(
      'Password reset',
      `<p>Click the link below to set a new password. This link expires in 30 minutes.</p>
       <p><a href="${link}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset password</a></p>`
    ),
  });

exports.sendBookingConfirmation = (to, booking) =>
  sendMail({
    to,
    subject: `Booking confirmed - ${booking.bookingCode}`,
    html: base(
      'Booking confirmed',
      `<p>Hi ${booking.guestInfo?.name || ''},</p>
       <p>Your booking <strong>${booking.bookingCode}</strong> has been confirmed.</p>
       <table style="width:100%;border-collapse:collapse">
         <tr><td><b>Check-in:</b></td><td>${new Date(booking.checkIn).toDateString()}</td></tr>
         <tr><td><b>Check-out:</b></td><td>${new Date(booking.checkOut).toDateString()}</td></tr>
         <tr><td><b>Nights:</b></td><td>${booking.nights}</td></tr>
         <tr><td><b>Total:</b></td><td>${booking.pricing?.total?.toLocaleString()} VND</td></tr>
       </table>`
    ),
  });

exports.sendBookingCancelled = (to, booking) =>
  sendMail({
    to,
    subject: `Booking cancelled - ${booking.bookingCode}`,
    html: base(
      'Booking cancelled',
      `<p>Your booking <strong>${booking.bookingCode}</strong> has been cancelled.</p>
       <p>Reason: ${booking.cancelReason || 'N/A'}</p>`
    ),
  });
