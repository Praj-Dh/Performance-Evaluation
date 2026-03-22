-- Teams table and TeamMembers FK to Users + Teams.
-- Run once on existing DB. New installs: use schema.sql which includes these.

SET NAMES utf8mb4;

-- Create Teams table (references Users)
CREATE TABLE IF NOT EXISTS `Teams` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `manager_id` INT UNSIGNED DEFAULT NULL COMMENT 'Lead manager for this team',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teams_manager_id` (`manager_id`),
  CONSTRAINT `fk_teams_manager` FOREIGN KEY (`manager_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure we have at least one team for backfill (run once)
INSERT INTO `Teams` (`name`, `department`) VALUES ('General', NULL);

-- Add new columns to TeamMembers (run once; ignore "Duplicate column" if already applied)
ALTER TABLE `TeamMembers`
  ADD COLUMN `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'Link to Users for login accounts' AFTER `id`,
  ADD COLUMN `team_id` INT UNSIGNED DEFAULT NULL AFTER `user_id`;

-- Backfill: assign existing rows to first team
UPDATE `TeamMembers` SET `team_id` = (SELECT `id` FROM `Teams` ORDER BY `id` ASC LIMIT 1) WHERE `team_id` IS NULL;

ALTER TABLE `TeamMembers`
  ADD KEY `idx_teammembers_user_id` (`user_id`),
  ADD KEY `idx_teammembers_team_id` (`team_id`),
  ADD CONSTRAINT `fk_teammembers_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teammembers_team` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
