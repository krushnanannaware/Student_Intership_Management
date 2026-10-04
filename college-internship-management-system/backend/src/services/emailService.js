const nodemailer = require("nodemailer");

/* ── Startup credential check ───────────────────────────────── */
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";

const isPlaceholder = (val) =>
  !val ||
  val.includes("your_gmail") ||
  val.includes("your_email") ||
  val.includes("your_smtp") ||
  val === "your_gmail_app_password" ||
  val === "your_email_password";

if (isPlaceholder(EMAIL_USER) || isPlaceholder(EMAIL_PASS)) {
  console.warn("============================================");
  console.warn("[EMAIL] WARNING: Email credentials are not configured.");
  console.warn("[EMAIL] OTP emails will NOT be sent until you update .env:");
  console.warn("[EMAIL]   EMAIL_USER=your_real_gmail@gmail.com");
  console.warn("[EMAIL]   EMAIL_PASS=your_16char_app_password");
  console.warn("[EMAIL] For Gmail: enable 2FA → Google Account → Security → App Passwords");
  console.warn("============================================");
}

/**
 * Create a nodemailer transporter using environment variables.
 * Supports Gmail service shorthand or generic SMTP.
 */
const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE; // e.g. "gmail"
  if (service) {
    return nodemailer.createTransport({
      service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Generic SMTP fallback
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a password-reset OTP email.
 * @param {string} toEmail  - Recipient email
 * @param {string} otp      - 6-digit OTP code
 * @param {string} role     - "student" | "faculty"
 */
const sendOTPEmail = async (toEmail, otp, role = "user") => {
  const transporter = createTransporter();

  const roleLabel = role === "faculty" ? "Faculty" : "Student";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 32px 24px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 32px 24px; }
    .otp-box { background: #f0f0ff; border: 2px dashed #4f46e5; border-radius: 10px; text-align: center; padding: 20px; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; }
    .expiry { font-size: 13px; color: #888; margin-top: 8px; }
    .footer { background: #f8f8f8; padding: 16px 24px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 College IMS</h1>
      <p>Internship Management System</p>
    </div>
    <div class="body">
      <h2 style="margin:0 0 8px; color:#1e293b;">Password Reset OTP</h2>
      <p style="color:#555; font-size:14px;">
        Hello, ${roleLabel}!<br/><br/>
        We received a request to reset the password for your account.
        Use the OTP below to complete the process.
      </p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expiry">⏱ This OTP expires in <strong>10 minutes</strong></div>
      </div>
      <p style="color:#555; font-size:13px;">
        If you did not request a password reset, please ignore this email.
        Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} College IMS &mdash; Do not reply to this email.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    `"College IMS" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: "College IMS – Password Reset OTP",
    html,
  });
};

module.exports = { sendOTPEmail };
