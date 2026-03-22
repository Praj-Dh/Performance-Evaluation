-- Migration 006: FeedbackRequests table for "Request Feedback" on My Reviews
-- requested_by = employee, requested_from = manager (from TeamMembers -> Teams.manager_id)

CREATE TABLE IF NOT EXISTS `FeedbackRequests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `requested_by` INT UNSIGNED NOT NULL COMMENT 'User who requested feedback',
  `requested_from` INT UNSIGNED NOT NULL COMMENT 'User (manager) requested to provide feedback',
  `message` TEXT DEFAULT NULL COMMENT 'Optional message from requester',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, completed, cancelled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_feedback_requests_requested_by` (`requested_by`),
  KEY `idx_feedback_requests_requested_from` (`requested_from`),
  CONSTRAINT `fk_feedback_requests_by` FOREIGN KEY (`requested_by`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_requests_from` FOREIGN KEY (`requested_from`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
