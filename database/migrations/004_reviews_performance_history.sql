-- Migration 004: Add performance history fields to Reviews table
-- Sprint 2 - Performance History feature
-- Adds: manager_id, review_date, score (0-100), manager_feedback, review_type, tags

-- Add manager_id (FK to Users) - who wrote the review
ALTER TABLE `Reviews`
  ADD COLUMN `manager_id` INT UNSIGNED DEFAULT NULL COMMENT 'Manager who wrote the review'
  AFTER `user_id`;

ALTER TABLE `Reviews`
  ADD CONSTRAINT `fk_reviews_manager`
    FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add review_date (when the review period covers)
ALTER TABLE `Reviews`
  ADD COLUMN `review_date` DATE DEFAULT NULL COMMENT 'Date of the review'
  AFTER `manager_id`;

-- Add score (0-100 scale, matching Figma design)
ALTER TABLE `Reviews`
  ADD COLUMN `score` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Performance score 0-100'
  AFTER `content`;

-- Add manager_feedback (longer text feedback from manager)
ALTER TABLE `Reviews`
  ADD COLUMN `manager_feedback` TEXT DEFAULT NULL COMMENT 'Detailed manager feedback'
  AFTER `score`;

-- Add review_type (annual, mid-year, quarterly)
ALTER TABLE `Reviews`
  ADD COLUMN `review_type` VARCHAR(20) DEFAULT 'annual' COMMENT 'annual, mid-year, quarterly'
  AFTER `manager_feedback`;

-- Add tags (comma-separated tags like LEADERSHIP, TECHNICAL)
ALTER TABLE `Reviews`
  ADD COLUMN `tags` VARCHAR(255) DEFAULT NULL COMMENT 'Comma-separated tags e.g. LEADERSHIP,TECHNICAL'
  AFTER `review_type`;

-- Index for performance history queries (employee reviews sorted by date)
ALTER TABLE `Reviews`
  ADD KEY `idx_reviews_user_date` (`user_id`, `review_date` DESC);

ALTER TABLE `Reviews`
  ADD KEY `idx_reviews_manager_id` (`manager_id`);
