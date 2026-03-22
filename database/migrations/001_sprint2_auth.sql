-- Sprint 2 Auth: role + password reset. Run once on existing DB.
-- New installs: use schema.sql which already includes these.

SET NAMES utf8mb4;

-- Add role to Users (run once; ignore "Duplicate column" if already applied)
ALTER TABLE `Users`
  ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'employee'
  COMMENT 'employee or manager'
  AFTER `display_name`;

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS `PasswordResetTokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_user_id` (`user_id`),
  KEY `idx_prt_token_hash` (`token_hash`),
  KEY `idx_prt_expires` (`expires_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
