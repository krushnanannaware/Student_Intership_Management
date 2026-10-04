-- ============================================================
-- OTP Password Reset Table
-- Run this migration on top of the existing schema
-- ============================================================

USE college_ims;

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    VARCHAR(255) NOT NULL,          -- bcrypt hash of the OTP
    expires_at  DATETIME NOT NULL,              -- OTP expiry timestamp
    used        TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = already consumed
    attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- wrong-attempt counter
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_email   (email),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB;
