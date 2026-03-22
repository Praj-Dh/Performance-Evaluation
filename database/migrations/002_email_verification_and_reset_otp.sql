-- Email verification (OTP) and password reset OTP support.
-- Run once on existing DB. New installs: use schema.sql which includes these.

SET NAMES utf8mb4;

-- Allow login only after email is verified
ALTER TABLE `Users`
  ADD COLUMN `email_verified_at` DATETIME DEFAULT NULL
  COMMENT 'Set when user verifies email via OTP'
  AFTER `updated_at`;

-- Existing users: treat as already verified so they can still sign in
UPDATE `Users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;

-- OTPs for signup email verification (6-digit code)
CREATE TABLE IF NOT EXISTS `EmailVerificationOtps` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evo_user_id` (`user_id`),
  KEY `idx_evo_expires` (`expires_at`),
  CONSTRAINT `fk_evo_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTPs for forgot-password (6-digit code, alternative to reset link)
CREATE TABLE IF NOT EXISTS `PasswordResetOtps` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pro_user_id` (`user_id`),
  KEY `idx_pro_expires` (`expires_at`),
  CONSTRAINT `fk_pro_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
