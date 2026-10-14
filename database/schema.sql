-- ====================================================================
-- Circlo – The Community Sharing Network
-- Database Schema Definition (database/schema.sql)
-- Reference: Practical-8 (MySQL database & table operations)
-- ====================================================================

-- 1. Create database if it does not exist
CREATE DATABASE IF NOT EXISTS circlo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE circlo_db;

-- 2. Drop existing tables in reverse dependency order for safe re-runs
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS borrow_requests;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- --------------------------------------------------------------------
-- Table 1: users
-- Core user entity storing credentials, role, status, and profile info
-- --------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  location VARCHAR(100) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- Table 2: categories
-- Standard item classification categories (e.g. Books, Electronics)
-- --------------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(50) DEFAULT 'box'
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- Table 3: items
-- Community items posted by users for sharing/borrowing
-- --------------------------------------------------------------------
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  item_condition ENUM('new', 'like_new', 'good', 'fair') NOT NULL DEFAULT 'good',
  location VARCHAR(100) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url VARCHAR(255) NOT NULL DEFAULT '/images/placeholder.png',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_owner FOREIGN KEY (owner_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) 
    REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_items_owner (owner_id),
  INDEX idx_items_category (category_id),
  INDEX idx_items_location (location),
  INDEX idx_items_available (is_available)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- Table 4: borrow_requests
-- Borrowing transactions workflow: request -> approve/reject -> borrowed -> returned
-- --------------------------------------------------------------------
CREATE TABLE borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrower_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'borrowed', 'returned', 'cancelled') NOT NULL DEFAULT 'pending',
  owner_response_note TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_item FOREIGN KEY (item_id) 
    REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_requests_borrower FOREIGN KEY (borrower_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_requests_item (item_id),
  INDEX idx_requests_borrower (borrower_id),
  INDEX idx_requests_status (status),
  INDEX idx_requests_dates (start_date, end_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- Table 5: reviews
-- Ratings and feedback left after completing a borrow transaction
-- --------------------------------------------------------------------
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_request FOREIGN KEY (request_id) 
    REFERENCES borrow_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_reviews_reviewee (reviewee_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- Table 6: reports
-- User and item reports reviewed and moderated by admins
-- --------------------------------------------------------------------
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  reported_user_id INT DEFAULT NULL,
  reported_item_id INT DEFAULT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT DEFAULT NULL,
  status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reports_user FOREIGN KEY (reported_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reports_item FOREIGN KEY (reported_item_id) 
    REFERENCES items(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_reports_status (status),
  INDEX idx_reports_reporter (reporter_id)
) ENGINE=InnoDB;
