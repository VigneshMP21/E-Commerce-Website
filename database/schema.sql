-- ECW E-Commerce Database Schema
-- MySQL

CREATE DATABASE IF NOT EXISTS e_commerce;
USE e_commerce;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  avatar VARCHAR(500),
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  google_id VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  reset_token VARCHAR(500),
  reset_token_expires DATETIME,
  otp VARCHAR(6),
  otp_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(500),
  parent_id INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) DEFAULT NULL,
  cost_price DECIMAL(10, 2) DEFAULT NULL,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  category_id INT,
  brand VARCHAR(100),
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  weight DECIMAL(8, 2) DEFAULT NULL,
  images JSON,
  specifications JSON,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status ENUM('active', 'out_of_stock', 'draft') DEFAULT 'active',
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  sales_count INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_active (is_active),
  INDEX idx_featured (is_featured),
  INDEX idx_price (price),
  INDEX idx_rating (rating),
  INDEX idx_sales (sales_count),
  FULLTEXT INDEX idx_search (name, description)
);

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100),
  image VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSON,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (product_id, user_id),
  INDEX idx_product (product_id),
  INDEX idx_user (user_id),
  INDEX idx_approved (is_approved)
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id)
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_cart (cart_id),
  UNIQUE KEY unique_cart_product (cart_id, product_id, variant_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  INDEX idx_user (user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  shipping_address_id INT,
  billing_address_id INT,
  coupon_code VARCHAR(50),
  notes TEXT,
  shipped_at DATETIME,
  delivered_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_payment (payment_status),
  INDEX idx_created (created_at)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  variant_info VARCHAR(255),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
);

-- Order tracking
CREATE TABLE IF NOT EXISTS order_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at DATETIME,
  expires_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active)
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  btn_text VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
);

-- Payments/Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  status VARCHAR(50),
  response_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_payment (payment_id)
);

-- Recently viewed
CREATE TABLE IF NOT EXISTS recently_viewed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- Seed data: Admin user (password: Admin@123)
INSERT INTO users (name, email, password, role, is_verified) VALUES
('Admin', 'admin@ecwshop.com', '$2a$10$YourHashedPasswordHere', 'admin', true);

-- Seed data: Categories
INSERT INTO categories (name, slug, description, is_active) VALUES
('Electronics', 'electronics', 'Latest gadgets and electronic devices', true),
('Fashion', 'fashion', 'Trendy clothing and accessories', true),
('Home & Living', 'home-living', 'Beautiful home decor and furniture', true),
('Beauty', 'beauty', 'Skincare, makeup and beauty products', true),
('Books', 'books', 'Books across all genres', true),
('Sports', 'sports', 'Sports equipment and activewear', true);

-- Seed data: Subcategories
INSERT INTO categories (name, slug, description, parent_id, is_active) VALUES
('Smartphones', 'smartphones', 'Latest smartphones', 1, true),
('Laptops', 'laptops', 'Notebooks and laptops', 1, true),
('Headphones', 'headphones', 'Audio devices', 1, true),
('Men Clothing', 'men-clothing', 'Men fashion', 2, true),
('Women Clothing', 'women-clothing', 'Women fashion', 2, true),
('Furniture', 'furniture', 'Home furniture', 3, true);

-- Seed data: Sample products
INSERT INTO products (name, slug, description, price, compare_price, category_id, stock_quantity, images, is_featured, status, rating, review_count) VALUES
('Wireless Noise Cancelling Headphones', 'wireless-nc-headphones', 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design.', 249.99, 349.99, 3, 50, '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"]', true, 'active', 4.5, 128),
('Smart Watch Pro', 'smart-watch-pro', 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.', 199.99, 299.99, 1, 35, '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"]', true, 'active', 4.3, 89),
('Premium Leather Backpack', 'premium-leather-backpack', 'Handcrafted genuine leather backpack with laptop compartment and USB charging port.', 89.99, 129.99, 4, 25, '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"]', true, 'active', 4.7, 56),
('Minimalist Desk Lamp', 'minimalist-desk-lamp', 'Modern LED desk lamp with adjustable brightness, color temperature, and wireless charging base.', 59.99, 79.99, 6, 100, '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"]', true, 'active', 4.2, 34),
('Organic Skincare Set', 'organic-skincare-set', 'Complete natural skincare routine with cleanser, serum, and moisturizer.', 45.99, 65.99, 7, 80, '["https://images.unsplash.com/photo-1570194065650-d99fb4b38c34?w=600"]', true, 'active', 4.8, 92),
('Bluetooth Portable Speaker', 'bluetooth-speaker', 'Waterproof portable speaker with 360-degree sound and 20-hour battery.', 79.99, 99.99, 3, 60, '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"]', false, 'active', 4.1, 45);
