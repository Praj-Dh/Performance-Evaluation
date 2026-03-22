-- Migration 008: Notifications "seen" timestamp for clearing badge when user views notifications dropdown

SET NAMES utf8mb4;

ALTER TABLE `Users`
  ADD COLUMN `notifications_seen_at` DATETIME DEFAULT NULL
  COMMENT 'When user last viewed the notifications dropdown'
  AFTER `email_verified_at`;
