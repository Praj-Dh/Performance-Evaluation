-- Team Fantastic 5 - CSE 442
-- Database schema: Users, Reviews, Collaborations

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table: Users
-- ----------------------------
DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'employee' COMMENT 'employee, manager, or admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email_verified_at` DATETIME DEFAULT NULL COMMENT 'Set when user verifies email via OTP',
  `notifications_seen_at` DATETIME DEFAULT NULL COMMENT 'When user last viewed the notifications dropdown',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: Teams
-- ----------------------------
DROP TABLE IF EXISTS `Teams`;
CREATE TABLE `Teams` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `manager_id` INT UNSIGNED DEFAULT NULL COMMENT 'Lead manager for this team',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teams_manager_id` (`manager_id`),
  CONSTRAINT `fk_teams_manager` FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: TeamMembers (linked to Users and Teams)
-- ----------------------------
DROP TABLE IF EXISTS `TeamMembers`;
CREATE TABLE `TeamMembers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'Link to Users for login accounts',
  `team_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(100) DEFAULT NULL COMMENT 'Job title / role tag',
  `department` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teammembers_user_id` (`user_id`),
  KEY `idx_teammembers_team_id` (`team_id`),
  CONSTRAINT `fk_teammembers_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_teammembers_team` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: Reviews
-- ----------------------------
DROP TABLE IF EXISTS `Reviews`;
CREATE TABLE `Reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `manager_id` INT UNSIGNED DEFAULT NULL COMMENT 'Manager who wrote the review',
  `review_date` DATE DEFAULT NULL COMMENT 'Date of the review',
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT DEFAULT NULL,
  `score` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Performance score 0-100',
  `score_technical` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Technical Excellence score 0-100',
  `score_impact` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Impact and Delivery score 0-100',
  `score_leadership` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Leadership and Influence score 0-100',
  `rating` TINYINT UNSIGNED DEFAULT NULL COMMENT '1-5',
  `manager_feedback` TEXT DEFAULT NULL COMMENT 'Detailed manager feedback',
  `review_type` VARCHAR(20) DEFAULT 'annual' COMMENT 'annual, mid-year, quarterly',
  `tags` VARCHAR(255) DEFAULT NULL COMMENT 'Comma-separated tags e.g. LEADERSHIP,TECHNICAL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_user_id` (`user_id`),
  KEY `idx_reviews_manager_id` (`manager_id`),
  KEY `idx_reviews_user_date` (`user_id`, `review_date` DESC),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_manager` FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: Collaborations
-- ----------------------------
DROP TABLE IF EXISTS `Collaborations`;
CREATE TABLE `Collaborations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `review_id` INT UNSIGNED NOT NULL,
  `role` VARCHAR(50) DEFAULT 'collaborator' COMMENT 'e.g. collaborator, viewer',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_collab_user_review` (`user_id`, `review_id`),
  KEY `idx_collab_review_id` (`review_id`),
  CONSTRAINT `fk_collab_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collab_review` FOREIGN KEY (`review_id`) REFERENCES `Reviews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: CollaborationEvents (Log Event - mentorship, peer support, etc.)
-- ----------------------------
DROP TABLE IF EXISTS `CollaborationEvents`;
CREATE TABLE `CollaborationEvents` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `event_type` VARCHAR(32) NOT NULL COMMENT 'mentorship, peer_support, knowledge, cross_dept',
  `title` VARCHAR(255) NOT NULL,
  `event_date` DATE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `tagged_peers` VARCHAR(500) DEFAULT NULL COMMENT 'comma-separated display names or IDs',
  `status` VARCHAR(20) NOT NULL DEFAULT 'submitted' COMMENT 'draft, submitted',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_collab_events_user` (`user_id`),
  KEY `idx_collab_events_date` (`event_date`),
  CONSTRAINT `fk_collab_events_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: PasswordResetTokens (forgot password - secure one-time tokens)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `PasswordResetTokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL COMMENT 'SHA-256 of token',
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_user_id` (`user_id`),
  KEY `idx_prt_token_hash` (`token_hash`),
  KEY `idx_prt_expires` (`expires_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: EmailVerificationOtps (signup email verification - 6-digit OTP)
-- ----------------------------
DROP TABLE IF EXISTS `EmailVerificationOtps`;
CREATE TABLE `EmailVerificationOtps` (
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

-- ----------------------------
-- Table: PasswordResetOtps (forgot password via OTP - 6-digit code)
-- ----------------------------
DROP TABLE IF EXISTS `PasswordResetOtps`;
CREATE TABLE `PasswordResetOtps` (
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

SET FOREIGN_KEY_CHECKS = 1;
