-- ============================================================
-- Username Column Migration
-- Adds username column to users table
-- Run this migration after otp_migration.sql
-- ============================================================

USE college_ims;

-- Add username column (nullable first so existing rows don't fail)
ALTER TABLE users
  ADD COLUMN username VARCHAR(100) NULL AFTER email,
  ADD UNIQUE KEY uq_users_username (username);

-- Back-fill username for existing users from their email (before the @)
UPDATE users SET username = CONCAT(SUBSTRING_INDEX(email, '@', 1), '_', id)
WHERE username IS NULL;

-- Now make it NOT NULL
ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL;
