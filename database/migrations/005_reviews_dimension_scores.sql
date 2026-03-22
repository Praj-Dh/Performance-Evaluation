-- Migration 005: Add dimension score columns to Reviews table
-- Sprint 3 - Adds Technical Excellence, Impact & Delivery, Leadership & Influence scores
-- These enable granular performance breakdowns on dashboards and review pages.

ALTER TABLE `Reviews`
  ADD COLUMN `score_technical` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Technical Excellence score 0-100'
  AFTER `score`;

ALTER TABLE `Reviews`
  ADD COLUMN `score_impact` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Impact and Delivery score 0-100'
  AFTER `score_technical`;

ALTER TABLE `Reviews`
  ADD COLUMN `score_leadership` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Leadership and Influence score 0-100'
  AFTER `score_impact`;
