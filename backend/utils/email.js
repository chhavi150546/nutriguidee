/**
 * utils/email.js — Nodemailer transporter + email helpers
 *
 * Configure via .env:
 *   EMAIL_HOST     SMTP host      (e.g. smtp.gmail.com)
 *   EMAIL_PORT     SMTP port      (465 for SSL, 587 for TLS)
 *   EMAIL_SECURE   true/false     (true = SSL, false = STARTTLS)
 *   EMAIL_USER     sender address
 *   EMAIL_PASS     sender password / app-password
 *   FRONTEND_URL   base URL for the verification link
 */

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || "smtp.gmail.com",
  port:   parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification email with a one-click link.
 * @param {string} to        recipient email
 * @param {string} token     raw verification token
 */
async function sendVerificationEmail(to, token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"NutriGuide" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your NutriGuide email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#16a34a">Welcome to NutriGuide!</h2>
        <p>Click the button below to verify your email address.
           This link expires in <strong>24 hours</strong>.</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#16a34a;color:#fff;border-radius:6px;
                  text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:13px">
          Or paste this URL into your browser:<br/>
          <a href="${link}">${link}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
