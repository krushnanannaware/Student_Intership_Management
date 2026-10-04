const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");
const pool     = require("../config/db");
const { sendOTPEmail } = require("../services/emailService");

/* ── helpers ─────────────────────────────────────────────────── */

/** Generate a cryptographically secure 6-digit OTP */
const generateOTP = () => String(crypto.randomInt(100000, 999999));

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS       = 5;
const RESEND_COOLDOWN_S  = 60; // 60-second cooldown for resend

/* ── 1. Request OTP ─────────────────────────────────────────── */
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Check email exists in users
    const [users] = await pool.query(
      "SELECT id, email, role FROM users WHERE email = ? AND is_active = 1",
      [email]
    );

    // Security: always respond the same way whether email exists or not
    // (prevents email enumeration)
    const emailExists = users.length > 0;

    if (emailExists) {
      // Enforce resend cooldown — check most recent OTP for this email
      const [recent] = await pool.query(
        "SELECT created_at FROM password_reset_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1",
        [email]
      );
      if (recent.length) {
        const secondsSinceLastOTP = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
        if (secondsSinceLastOTP < RESEND_COOLDOWN_S) {
          const wait = Math.ceil(RESEND_COOLDOWN_S - secondsSinceLastOTP);
          return res.status(429).json({
            success: false,
            message: `Please wait ${wait} second(s) before requesting a new OTP.`,
            cooldown: wait,
          });
        }
      }

      const otp       = generateOTP();
      const otpHash   = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Invalidate any previous OTPs for this email
      await pool.query(
        "UPDATE password_reset_otps SET used = 1 WHERE email = ? AND used = 0",
        [email]
      );

      // Store new OTP in DB
      await pool.query(
        "INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)",
        [email, otpHash, expiresAt]
      );

      const role = users[0].role;

      // ── Try to send OTP email ─────────────────────────────────
      let emailSent = true;
      try {
        await sendOTPEmail(email, otp, role);
        console.log(`[OTP] Email sent successfully to ${email}`);
      } catch (mailErr) {
        emailSent = false;

        // Always log the full error so you can diagnose it
        console.error("============================================");
        console.error("[OTP] EMAIL SENDING FAILED");
        console.error("  To          :", email);
        console.error("  Error code  :", mailErr.code);
        console.error("  Error msg   :", mailErr.message);
        console.error("  EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "(not set)");
        console.error("  EMAIL_USER  :", process.env.EMAIL_USER || "(not set)");
        console.error(
          "  EMAIL_PASS  :",
          process.env.EMAIL_PASS ? `(set, ${process.env.EMAIL_PASS.length} chars)` : "(not set)"
        );
        console.error("============================================");

        if (process.env.NODE_ENV !== "production") {
          // ── DEV MODE ──────────────────────────────────────────
          // OTP is kept valid in DB so the full flow can be tested.
          // Enter the OTP shown below on the Forgot Password screen.
          console.warn("╔══════════════════════════════════════════════╗");
          console.warn("║         [DEV MODE] USE THIS OTP              ║");
          console.warn(`║  Email : ${email}`);
          console.warn(`║  OTP   : ${otp}   (valid for 10 minutes)`);
          console.warn("╚══════════════════════════════════════════════╝");
          console.warn("[DEV MODE] Copy the OTP above and enter it on screen.");
          console.warn("[DEV MODE] Add EMAIL_USER + EMAIL_PASS to .env to send real emails.");
          // OTP is intentionally NOT invalidated here — it stays usable for testing
        } else {
          // ── PRODUCTION ────────────────────────────────────────
          // Invalidate OTP so it can't be guessed, and return error
          await pool.query(
            "UPDATE password_reset_otps SET used = 1 WHERE email = ? AND expires_at = ?",
            [email, expiresAt]
          );
          return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please try again later.",
          });
        }
      }

      // In dev mode when email failed: return success so the frontend
      // advances to Step 2 (OTP entry). The user gets the OTP from console.
      if (!emailSent && process.env.NODE_ENV !== "production") {
        return res.json({
          success: true,
          message: "OTP generated. Check the backend console for your OTP code.",
        });
      }
    }

    // Always return the same success message (security — no email enumeration)
    return res.json({
      success: true,
      message: "If this email is registered, an OTP has been sent to it.",
    });
  } catch (err) {
    console.error("requestOTP error:", err);
    res.status(500).json({ success: false, message: "Failed to process request. Please try again." });
  }
};

/* ── 2. Verify OTP ──────────────────────────────────────────── */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    // Find valid (unused, unexpired) OTP for this email
    const [rows] = await pool.query(
      `SELECT id, otp_hash, expires_at, attempts
       FROM password_reset_otps
       WHERE email = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No valid OTP found. It may have expired. Please request a new one.",
      });
    }

    const record = rows[0];

    // Check attempt limit
    if (record.attempts >= MAX_ATTEMPTS) {
      await pool.query("UPDATE password_reset_otps SET used = 1 WHERE id = ?", [record.id]);
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const valid = await bcrypt.compare(String(otp), record.otp_hash);

    if (!valid) {
      // Increment attempt counter
      await pool.query(
        "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?",
        [record.id]
      );
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
          : "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // OTP correct — mark as used
    await pool.query("UPDATE password_reset_otps SET used = 1 WHERE id = ?", [record.id]);

    // Issue a short-lived reset token
    const resetToken  = crypto.randomBytes(32).toString("hex");
    const tokenHash   = await bcrypt.hash(resetToken, 10);
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Store reset token (used = 2 means "verified, awaiting password change")
    await pool.query(
      "INSERT INTO password_reset_otps (email, otp_hash, expires_at, used) VALUES (?, ?, ?, 2)",
      [email, tokenHash, tokenExpiry]
    );

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken, // sent to frontend, used in reset step
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    res.status(500).json({ success: false, message: "OTP verification failed. Please try again." });
  }
};

/* ── 3. Reset Password ──────────────────────────────────────── */
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, new_password, confirm_password } = req.body;

    if (!email || !resetToken || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: "Password must include uppercase, lowercase, number and special character.",
      });
    }

    // Find the verified reset-token record (used = 2)
    const [rows] = await pool.query(
      `SELECT id, otp_hash, expires_at
       FROM password_reset_otps
       WHERE email = ? AND used = 2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Reset session expired or invalid. Please restart the forgot-password flow.",
      });
    }

    const record     = rows[0];
    const validToken = await bcrypt.compare(resetToken, record.otp_hash);

    if (!validToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token. Please restart the forgot-password flow.",
      });
    }

    // Invalidate the reset token
    await pool.query("UPDATE password_reset_otps SET used = 1 WHERE id = ?", [record.id]);

    // Hash new password and update
    const hashed = await bcrypt.hash(new_password, 10);
    const [updateResult] = await pool.query(
      "UPDATE users SET password = ? WHERE email = ? AND is_active = 1",
      [hashed, email]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User account not found or inactive." });
    }

    // Log the activity
    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (userRows.length) {
      await pool.query(
        "INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES (?, ?, ?, ?)",
        [userRows[0].id, "PASSWORD_RESET", "user", `Password reset via OTP for ${email}`]
      );
    }

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: "Failed to reset password. Please try again." });
  }
};

module.exports = { requestOTP, verifyOTP, resetPassword };
