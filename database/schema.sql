-- =========================================================================
-- SAHABAT MAHASISWA - MYSQL DATABASE SCHEMA & COMPATIBILITY VIEWS
-- Migrated from Supabase (PostgreSQL) to MySQL (Laragon / MariaDB)
-- Database Name: sahabat_mahasiswa
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `sahabat_mahasiswa` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `sahabat_mahasiswa`;

-- -------------------------------------------------------------------------
-- 1. Table: users (Central Student Profile & Authentication)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `kampus` VARCHAR(255) NOT NULL DEFAULT 'Universitas Siliwangi (UNSIL)',
  `fakultas` VARCHAR(255) NULL DEFAULT '',
  `jurusan` VARCHAR(255) NULL DEFAULT 'Informatika',
  `semester` INT NOT NULL DEFAULT 1,
  `telp` VARCHAR(50) NULL DEFAULT '',
  `avatar_url` LONGTEXT NULL,
  `student_email` VARCHAR(255) NULL DEFAULT NULL,
  `student_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `google_email` VARCHAR(255) NULL DEFAULT NULL,
  `google_linked` TINYINT(1) NOT NULL DEFAULT 0,
  `tiktok_client_key` VARCHAR(255) NULL DEFAULT NULL,
  `tiktok_access_token` TEXT NULL DEFAULT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. Table: kos (Catalog Kosan Mahasiswa Sekitar Kampus)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `gender_type` ENUM('putra', 'putri', 'campur') NOT NULL DEFAULT 'campur',
  `price_per_month` INT UNSIGNED NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL DEFAULT 'Tasikmalaya',
  `campus_name` VARCHAR(255) NOT NULL DEFAULT 'Universitas Siliwangi (UNSIL)',
  `distance_km` DECIMAL(4,1) NOT NULL DEFAULT 1.0,
  `lat` DECIMAL(10, 7) NOT NULL DEFAULT -7.3512000,
  `lng` DECIMAL(10, 7) NOT NULL DEFAULT 108.2234000,
  `rating` DECIMAL(2, 1) NOT NULL DEFAULT 4.8,
  `sisa_kamar` INT NOT NULL DEFAULT 3,
  `contact_phone` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `facilities` JSON NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. Table: assignment_deadlines (Manajemen Tugas Kuliah)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignment_deadlines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `course_schedule_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `due_date` DATETIME NOT NULL,
  `weight` ENUM('rendah', 'sedang', 'tinggi') NOT NULL DEFAULT 'sedang',
  `difficulty` ENUM('mudah', 'sedang', 'sulit') NOT NULL DEFAULT 'sedang',
  `priority_score` INT UNSIGNED NOT NULL DEFAULT 50,
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `completed_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `assignment_deadlines_user_id_index` (`user_id`),
  CONSTRAINT `fk_assignment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. Table: wallet_transactions (Catatan Keuangan Dompet Mahasiswa)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `amount` INT UNSIGNED NOT NULL,
  `description` VARCHAR(255) NULL,
  `transaction_date` DATE NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wallet_transactions_user_id_index` (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. Table: food_vouchers (Promo & Voucher Makan Mahasiswa)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_vouchers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `merchant_name` VARCHAR(255) NOT NULL,
  `category` ENUM('warteg', 'cafe', 'fast_food', 'resto', 'minuman') NOT NULL DEFAULT 'warteg',
  `discount_label` VARCHAR(255) NOT NULL,
  `promo_code` VARCHAR(255) NOT NULL,
  `terms` TEXT NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `valid_until` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `claim_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. Table: job_vacancies (Lowongan Kerja Mahasiswa Part-Time / Freelance)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_vacancies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `type` ENUM('part_time', 'internship', 'freelance') NOT NULL DEFAULT 'part_time',
  `work_system` ENUM('on_site', 'hybrid', 'remote') NOT NULL DEFAULT 'on_site',
  `salary_range` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `schedule_flexibility` VARCHAR(255) NULL,
  `requirements` JSON NULL,
  `application_url_or_email` VARCHAR(255) NOT NULL,
  `is_open` TINYINT(1) NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- DATABASE COMPATIBILITY VIEWS
-- Memetakan nama tabel & kolom lama ke arsitektur standar MySQL
-- =========================================================================

CREATE OR REPLACE VIEW `profiles` AS
SELECT 
  `id`,
  `email`,
  `name` AS `nama`,
  `kampus`,
  `fakultas`,
  `jurusan`,
  `semester`,
  `telp`,
  `avatar_url`,
  `student_email`,
  `student_verified`,
  `google_email`,
  `google_linked`,
  `tiktok_client_key`,
  `tiktok_access_token`,
  `created_at`,
  `updated_at`
FROM `users`;

CREATE OR REPLACE VIEW `tugas` AS
SELECT 
  `id`,
  `user_id`,
  `title` AS `nama_tugas`,
  `due_date` AS `deadline`,
  CASE 
    WHEN `weight` = 'rendah' THEN 1
    WHEN `weight` = 'tinggi' THEN 3
    ELSE 2
  END AS `bobot`,
  (`status` = 'completed') AS `selesai`,
  `created_at`,
  `updated_at`
FROM `assignment_deadlines`;

CREATE OR REPLACE VIEW `transaksi` AS
SELECT 
  `id`,
  `user_id`,
  CASE 
    WHEN `type` = 'income' THEN 'masuk'
    ELSE 'keluar'
  END AS `jenis`,
  `category` AS `kategori`,
  `amount` AS `nominal`,
  `description` AS `catatan`,
  `transaction_date` AS `tanggal`,
  `created_at`,
  `updated_at`
FROM `wallet_transactions`;

CREATE OR REPLACE VIEW `kosan` AS
SELECT 
  `id`,
  `name` AS `nama`,
  `slug`,
  `gender_type` AS `tipe`,
  `price_per_month` AS `harga`,
  `address` AS `alamat`,
  `city` AS `kota`,
  `campus_name` AS `area`,
  `distance_km` AS `jarak`,
  `contact_phone` AS `telp`,
  `image_url` AS `foto_url`,
  `facilities` AS `fasilitas`,
  `is_available`,
  `description` AS `deskripsi`,
  `lat`,
  `lng`,
  `rating`,
  `sisa_kamar`,
  `created_at`,
  `updated_at`
FROM `kos`;
