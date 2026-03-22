-- Single chat table for peer-to-peer messages (Peers page).
-- conversation_id groups messages between two users: use format "smaller_user_id_larger_user_id" e.g. "5_12".
-- Run in phpMyAdmin or MySQL. Requires Users table to exist.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table: Chat
-- ----------------------------
DROP TABLE IF EXISTS `Chat`;
CREATE TABLE `Chat` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` VARCHAR(50) NOT NULL COMMENT 'Same for both sides e.g. 5_12 (smaller_user_id_larger_user_id)',
  `sender_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `message` TEXT NOT NULL,
  `message_length` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Character length of message',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_conversation` (`conversation_id`),
  KEY `idx_chat_sent` (`conversation_id`, `sent_at`),
  KEY `idx_chat_sender` (`sender_id`),
  KEY `idx_chat_receiver` (`receiver_id`),
  CONSTRAINT `fk_chat_sender` FOREIGN KEY (`sender_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
