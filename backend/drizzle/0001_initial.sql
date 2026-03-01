CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `exceptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exception_type` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `stack_trace` text NOT NULL,
  `simulated_code` text NOT NULL,
  `triggered_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_exceptions_user` (`triggered_by`),
  CONSTRAINT `fk_exceptions_user` FOREIGN KEY (`triggered_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `analysis_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exception_id` int NOT NULL,
  `root_cause` text NOT NULL,
  `solutions` text NOT NULL,
  `recommendations` text NOT NULL,
  `analyzed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_analysis_exception` (`exception_id`),
  CONSTRAINT `fk_analysis_exception` FOREIGN KEY (`exception_id`) REFERENCES `exceptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exception_id` int NOT NULL,
  `analysis_id` int NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL,
  `error_message` text NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_email_exception` (`exception_id`),
  KEY `fk_email_analysis` (`analysis_id`),
  CONSTRAINT `fk_email_exception` FOREIGN KEY (`exception_id`) REFERENCES `exceptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_email_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `analysis_results` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
