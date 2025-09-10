-- EcolithSwap Database Schema and Sample Data
-- Compatible with MariaDB 10.2.7+ or MySQL 5.7+
-- Created: 2025-01-02
-- Fixed: 2025-09-10

DROP DATABASE IF EXISTS ecolithswap;
CREATE DATABASE ecolithswap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecolithswap;

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Users Table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    location VARCHAR(255),
    role ENUM('customer', 'admin', 'station_manager') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email(100)),
    INDEX idx_users_phone (phone),
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB;

-- Stations Table
CREATE TABLE stations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    station_type ENUM('swap', 'charge', 'both') NOT NULL,
    available_batteries INT DEFAULT 0,
    total_slots INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    accepts_plastic BOOLEAN DEFAULT TRUE,
    self_service BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    operating_hours TEXT,
    contact_info TEXT,
    manager_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_stations_location (latitude, longitude),
    INDEX idx_stations_type (station_type),
    INDEX idx_stations_active (is_active),
    INDEX idx_stations_plastic (accepts_plastic),
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Batteries Table
CREATE TABLE batteries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    battery_code VARCHAR(255) UNIQUE NOT NULL,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    capacity_kwh DECIMAL(8, 2) NOT NULL,
    current_charge_percentage DECIMAL(5, 2) DEFAULT 100,
    status ENUM('available', 'rented', 'charging', 'maintenance', 'retired') DEFAULT 'available',
    health_status ENUM('excellent', 'good', 'fair', 'poor', 'critical') DEFAULT 'excellent',
    cycle_count INT DEFAULT 0,
    manufacture_date DATE,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    current_station_id CHAR(36),
    current_rental_id CHAR(36),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_batteries_code (battery_code(100)),
    INDEX idx_batteries_status (status),
    INDEX idx_batteries_health (health_status),
    INDEX idx_batteries_station (current_station_id),
    FOREIGN KEY (current_station_id) REFERENCES stations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Battery Rentals Table
CREATE TABLE battery_rentals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    battery_id CHAR(36) NOT NULL,
    pickup_station_id CHAR(36) NOT NULL,
    return_station_id CHAR(36),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    initial_charge_percentage DECIMAL(5, 2),
    final_charge_percentage DECIMAL(5, 2),
    distance_covered_km DECIMAL(8, 2),
    base_cost DECIMAL(10, 2) DEFAULT 50.00,
    hourly_rate DECIMAL(10, 2) DEFAULT 25.00,
    total_cost DECIMAL(10, 2),
    status ENUM('active', 'completed', 'cancelled', 'overdue') DEFAULT 'active',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_rentals_user (user_id),
    INDEX idx_rentals_battery (battery_id),
    INDEX idx_rentals_status (status),
    INDEX idx_rentals_payment (payment_status),
    INDEX idx_rentals_start (start_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (battery_id) REFERENCES batteries(id) ON DELETE CASCADE,
    FOREIGN KEY (pickup_station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (return_station_id) REFERENCES stations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Plastic Waste Logs Table
CREATE TABLE plastic_waste_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    station_id CHAR(36) NOT NULL,
    weight_kg DECIMAL(8, 3) NOT NULL,
    points_earned INT NOT NULL,
    co2_saved_kg DECIMAL(8, 3),
    plastic_type ENUM('PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'OTHER') DEFAULT 'OTHER',
    description TEXT,
    receipt_number VARCHAR(255) UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    verified_by CHAR(36),
    verified_at TIMESTAMP NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_waste_user (user_id),
    INDEX idx_waste_station (station_id),
    INDEX idx_waste_logged (logged_at),
    INDEX idx_waste_verified (verified),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Payments Table
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    rental_id CHAR(36),
    amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'KES',
    payment_method ENUM('mpesa', 'card', 'cash', 'points', 'bank_transfer') NOT NULL,
    payment_reference VARCHAR(255) UNIQUE,
    mpesa_receipt_number VARCHAR(255),
    transaction_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    description TEXT,
    metadata JSON,
    processed_at TIMESTAMP NULL,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_payments_user (user_id),
    INDEX idx_payments_rental (rental_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_method (payment_method),
    INDEX idx_payments_reference (payment_reference(100)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rental_id) REFERENCES battery_rentals(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- User Profiles Table
CREATE TABLE user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    occupation VARCHAR(255),
    vehicle_type VARCHAR(255),
    vehicle_model VARCHAR(255),
    license_plate VARCHAR(20),
    total_swaps INT DEFAULT 0,
    total_distance_km DECIMAL(10, 2) DEFAULT 0,
    total_amount_spent DECIMAL(10, 2) DEFAULT 0,
    plastic_recycled_kg DECIMAL(8, 3) DEFAULT 0,
    co2_saved_kg DECIMAL(8, 3) DEFAULT 0,
    money_saved DECIMAL(10, 2) DEFAULT 0,
    current_points INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    total_points_redeemed INT DEFAULT 0,
    preferences JSON,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_profiles_user (user_id),
    INDEX idx_profiles_swaps (total_swaps),
    INDEX idx_profiles_points (current_points),
    INDEX idx_profiles_avatar (avatar_url(100)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add FK for batteries after rentals
ALTER TABLE batteries 
ADD FOREIGN KEY (current_rental_id) REFERENCES battery_rentals(id) ON DELETE SET NULL;

-- ============================================================================
-- SAMPLE DATA (unchanged from your script)
-- ============================================================================

-- Insert Admin User
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified, phone_verified) VALUES
(UUID(), 'admin@ecolithswap.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'System Administrator', '+254700000001', 'admin', TRUE, TRUE, TRUE),
(UUID(), 'manager1@ecolithswap.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'John Kiprotich', '+254700000002', 'station_manager', TRUE, TRUE, TRUE),
(UUID(), 'manager2@ecolithswap.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'Grace Wanjiku', '+254700000003', 'station_manager', TRUE, TRUE, TRUE);

-- Insert Sample Customers
INSERT INTO users (id, email, password_hash, full_name, phone, location, is_active, email_verified, phone_verified) VALUES
(UUID(), 'john.doe@email.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'John Doe', '+254700123456', 'Nairobi', TRUE, TRUE, TRUE),
(UUID(), 'mary.smith@email.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'Mary Smith', '+254700123457', 'Mombasa', TRUE, TRUE, TRUE),
(UUID(), 'david.johnson@email.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'David Johnson', '+254700123458', 'Kisumu', TRUE, TRUE, TRUE),
(UUID(), 'sarah.wilson@email.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'Sarah Wilson', '+254700123459', 'Nakuru', TRUE, TRUE, TRUE),
(UUID(), 'james.brown@email.com', '$2y$10$9QzX3z3z3z3z3z3z3z3z3u12345678901234567890123456789012345678', 'James Brown', '+254700123460', 'Eldoret', TRUE, TRUE, TRUE);

-- Insert Charging Stations
INSERT INTO stations (id, name, address, latitude, longitude, station_type, available_batteries, total_slots, operating_hours, contact_info, manager_id) VALUES
(UUID(), 'Westlands Mall Station', 'Westlands Mall, Westlands Road, Nairobi', -1.2676, 36.8103, 'both', 8, 12, '06:00-22:00', 'westlands@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com')),
(UUID(), 'JKIA Terminal Station', 'Jomo Kenyatta International Airport, Terminal 1A', -1.3192, 36.9276, 'swap', 15, 20, '24/7', 'jkia@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com')),
(UUID(), 'CBD Central Station', 'Kencom House, City Hall Way, Nairobi CBD', -1.2921, 36.8219, 'both', 6, 10, '05:30-23:00', 'cbd@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager2@ecolithswap.com')),
(UUID(), 'Mombasa Port Station', 'Mombasa Port Authority, Mombasa', -4.0435, 39.6682, 'swap', 12, 15, '06:00-20:00', 'mombasa@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager2@ecolithswap.com')),
(UUID(), 'Kisumu Lakefront Station', 'Kisumu Impala Sanctuary Road', -0.0917, 34.7680, 'charge', 4, 8, '07:00-19:00', 'kisumu@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com')),
(UUID(), 'Karen Shopping Center', 'Karen Shopping Center, Karen Road', -1.3234, 36.7073, 'both', 7, 12, '08:00-21:00', 'karen@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager2@ecolithswap.com')),
(UUID(), 'University of Nairobi Station', 'University of Nairobi, Harry Thuku Road', -1.2795, 36.8166, 'swap', 5, 8, '06:00-22:00', 'uon@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com')),
(UUID(), 'Nakuru Town Station', 'Nakuru Town Center, Kenyatta Avenue', -0.3031, 36.0800, 'both', 9, 14, '06:30-21:30', 'nakuru@ecolithswap.com', (SELECT id FROM users WHERE email = 'manager2@ecolithswap.com'));

-- Insert Batteries
INSERT INTO batteries (id, battery_code, serial_number, model, manufacturer, capacity_kwh, current_charge_percentage, status, health_status, cycle_count, manufacture_date, last_maintenance_date, next_maintenance_due, current_station_id) VALUES
(UUID(), 'ECOS-BAT-001', 'ESN001240101', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 85.5, 'available', 'excellent', 45, '2024-08-15', '2024-12-01', '2025-03-01', (SELECT id FROM stations WHERE name = 'Westlands Mall Station')),
(UUID(), 'ECOS-BAT-002', 'ESN001240102', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 92.3, 'available', 'excellent', 32, '2024-08-15', '2024-12-01', '2025-03-01', (SELECT id FROM stations WHERE name = 'Westlands Mall Station')),
(UUID(), 'ECOS-BAT-003', 'ESN001240103', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 78.9, 'charging', 'good', 67, '2024-07-20', '2024-11-15', '2025-02-15', (SELECT id FROM stations WHERE name = 'Westlands Mall Station')),
(UUID(), 'ECOS-BAT-004', 'ESN001240104', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 100.0, 'available', 'excellent', 23, '2024-09-10', '2024-12-05', '2025-03-05', (SELECT id FROM stations WHERE name = 'JKIA Terminal Station')),
(UUID(), 'ECOS-BAT-005', 'ESN001240105', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 88.7, 'available', 'excellent', 41, '2024-08-01', '2024-11-20', '2025-02-20', (SELECT id FROM stations WHERE name = 'JKIA Terminal Station')),
(UUID(), 'ECOS-BAT-006', 'ESN001240106', 'EcoLithium Standard 3kWh', 'EcoLithium Technologies', 3.0, 95.2, 'available', 'good', 89, '2024-06-15', '2024-10-30', '2025-01-30', (SELECT id FROM stations WHERE name = 'CBD Central Station')),
(UUID(), 'ECOS-BAT-007', 'ESN001240107', 'EcoLithium Standard 3kWh', 'EcoLithium Technologies', 3.0, 73.4, 'rented', 'good', 76, '2024-07-01', '2024-11-10', '2025-02-10', NULL),
(UUID(), 'ECOS-BAT-008', 'ESN001240108', 'EcoLithium Standard 3kWh', 'EcoLithium Technologies', 3.0, 82.1, 'available', 'fair', 134, '2024-05-20', '2024-10-15', '2025-01-15', (SELECT id FROM stations WHERE name = 'Mombasa Port Station')),
(UUID(), 'ECOS-BAT-009', 'ESN001240109', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 91.6, 'available', 'excellent', 29, '2024-09-05', '2024-12-10', '2025-03-10', (SELECT id FROM stations WHERE name = 'Kisumu Lakefront Station')),
(UUID(), 'ECOS-BAT-010', 'ESN001240110', 'EcoLithium Pro 5kWh', 'EcoLithium Technologies', 5.0, 65.3, 'maintenance', 'poor', 198, '2024-04-10', '2024-09-25', '2024-12-25', (SELECT id FROM stations WHERE name = 'Karen Shopping Center'));

-- Insert User Profiles
INSERT INTO user_profiles (id, user_id, date_of_birth, gender, occupation, vehicle_type, vehicle_model, license_plate, total_swaps, total_distance_km, total_amount_spent, plastic_recycled_kg, co2_saved_kg, current_points, total_points_earned, preferences) VALUES
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), '1990-05-15', 'male', 'Software Engineer', 'Electric Scooter', 'Xiaomi Mi Electric Scooter Pro 2', 'KCA-001E', 12, 456.7, 1250.00, 12.5, 8.9, 150, 450, '{"preferred_station_type": "both", "notification_time": "07:00"}'),
(UUID(), (SELECT id FROM users WHERE email = 'mary.smith@email.com'), '1985-11-22', 'female', 'Marketing Manager', 'Electric Bike', 'Oigo E-Bike Model X', 'KCB-002E', 8, 234.2, 850.00, 8.3, 5.2, 75, 275, '{"preferred_station_type": "swap", "notification_time": "08:30"}'),
(UUID(), (SELECT id FROM users WHERE email = 'david.johnson@email.com'), '1992-03-08', 'male', 'Delivery Driver', 'Electric Motorcycle', 'Roam Air Electric Motorcycle', 'KCC-003E', 25, 1250.8, 3200.00, 25.7, 18.4, 320, 820, '{"preferred_station_type": "swap", "notification_time": "06:00"}'),
(UUID(), (SELECT id FROM users WHERE email = 'sarah.wilson@email.com'), '1988-07-14', 'female', 'Teacher', 'Electric Scooter', 'Segway Ninebot ES4', 'KCD-004E', 6, 178.5, 650.00, 6.2, 3.8, 45, 195, '{"preferred_station_type": "charge", "notification_time": "16:00"}'),
(UUID(), (SELECT id FROM users WHERE email = 'james.brown@email.com'), '1995-12-03', 'male', 'University Student', 'Electric Bike', 'Local Assembly E-Bike', 'KCE-005E', 15, 567.3, 1100.00, 15.4, 10.7, 210, 560, '{"preferred_station_type": "both", "notification_time": "09:00"}');

-- Insert Sample Battery Rentals
INSERT INTO battery_rentals (id, user_id, battery_id, pickup_station_id, return_station_id, start_time, end_time, initial_charge_percentage, final_charge_percentage, distance_covered_km, total_cost, status, payment_status) VALUES
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-001'), (SELECT id FROM stations WHERE name = 'Westlands Mall Station'), (SELECT id FROM stations WHERE name = 'CBD Central Station'), '2025-01-01 08:30:00', '2025-01-01 18:45:00', 85.5, 23.7, 45.2, 125.50, 'completed', 'completed'),
(UUID(), (SELECT id FROM users WHERE email = 'mary.smith@email.com'), (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-002'), (SELECT id FROM stations WHERE name = 'JKIA Terminal Station'), (SELECT id FROM stations WHERE name = 'JKIA Terminal Station'), '2025-01-01 12:15:00', '2025-01-01 19:30:00', 92.3, 34.8, 28.6, 87.25, 'completed', 'completed'),
(UUID(), (SELECT id FROM users WHERE email = 'david.johnson@email.com'), (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-004'), (SELECT id FROM stations WHERE name = 'JKIA Terminal Station'), NULL, '2025-01-02 06:00:00', NULL, 100.0, NULL, NULL, NULL, 'active', 'pending'),
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-005'), (SELECT id FROM stations WHERE name = 'Westlands Mall Station'), (SELECT id FROM stations WHERE name = 'JKIA Terminal Station'), '2024-12-30 14:20:00', '2024-12-30 20:15:00', 88.7, 42.1, 38.9, 98.75, 'completed', 'completed'),
(UUID(), (SELECT id FROM users WHERE email = 'sarah.wilson@email.com'), (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-006'), (SELECT id FROM stations WHERE name = 'CBD Central Station'), (SELECT id FROM stations WHERE name = 'CBD Central Station'), '2024-12-29 09:45:00', '2024-12-29 16:20:00', 95.2, 51.3, 22.4, 75.00, 'completed', 'completed');

-- Update battery rental references
-- UPDATE batteries SET current_rental_id = (SELECT id FROM battery_rentals WHERE battery_id = (SELECT id FROM batteries WHERE battery_code = 'ECOS-BAT-004')) WHERE battery_code = 'ECOS-BAT-007';
UPDATE batteries b
JOIN (
    SELECT br.id AS rental_id
    FROM battery_rentals br
    JOIN batteries bb ON bb.id = br.battery_id
    WHERE bb.battery_code = 'ECOS-BAT-004'
    ORDER BY br.id DESC
    LIMIT 1
) t
ON b.battery_code = 'ECOS-BAT-007'
SET b.current_rental_id = t.rental_id;

-- Insert Sample Plastic Waste Logs
INSERT INTO plastic_waste_logs (id, user_id, station_id, weight_kg, points_earned, co2_saved_kg, plastic_type, description, receipt_number, verified, verified_by, verified_at, logged_at) VALUES
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), (SELECT id FROM stations WHERE name = 'Westlands Mall Station'), 2.450, 25, 1.75, 'PET', 'Water bottles and soft drink containers', 'RCP001240001', TRUE, (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com'), '2025-01-01 19:00:00', '2025-01-01 18:50:00'),
(UUID(), (SELECT id FROM users WHERE email = 'mary.smith@email.com'), (SELECT id FROM stations WHERE name = 'JKIA Terminal Station'), 1.850, 18, 1.32, 'HDPE', 'Milk containers and detergent bottles', 'RCP001240002', TRUE, (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com'), '2025-01-01 20:15:00', '2025-01-01 19:35:00'),
(UUID(), (SELECT id FROM users WHERE email = 'david.johnson@email.com'), (SELECT id FROM stations WHERE name = 'CBD Central Station'), 3.720, 37, 2.65, 'PET', 'Mixed plastic bottles and containers', 'RCP001240003', TRUE, (SELECT id FROM users WHERE email = 'manager2@ecolithswap.com'), '2025-01-02 10:30:00', '2025-01-02 10:15:00'),
(UUID(), (SELECT id FROM users WHERE email = 'sarah.wilson@email.com'), (SELECT id FROM stations WHERE name = 'Mombasa Port Station'), 1.350, 14, 0.96, 'PP', 'Food containers and yogurt cups', 'RCP001240004', FALSE, NULL, NULL, '2025-01-02 15:20:00'),
(UUID(), (SELECT id FROM users WHERE email = 'james.brown@email.com'), (SELECT id FROM stations WHERE name = 'Westlands Mall Station'), 2.980, 30, 2.13, 'PET', 'Various beverage bottles', 'RCP001240005', TRUE, (SELECT id FROM users WHERE email = 'manager1@ecolithswap.com'), '2025-01-02 16:45:00', '2025-01-02 16:30:00');

-- Insert Sample Payments
INSERT INTO payments (id, user_id, rental_id, amount, payment_method, payment_reference, mpesa_receipt_number, status, description, processed_at) VALUES
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), (SELECT id FROM battery_rentals WHERE total_cost = 125.50), 125.50, 'mpesa', 'PAY-2025010118450001', 'RK45HJ7890', 'completed', 'Battery rental payment - ECOS-BAT-001', '2025-01-01 18:46:00'),
(UUID(), (SELECT id FROM users WHERE email = 'mary.smith@email.com'), (SELECT id FROM battery_rentals WHERE total_cost = 87.25), 87.25, 'mpesa', 'PAY-2025010119300002', 'RK45HJ7891', 'completed', 'Battery rental payment - ECOS-BAT-002', '2025-01-01 19:31:00'),
(UUID(), (SELECT id FROM users WHERE email = 'john.doe@email.com'), (SELECT id FROM battery_rentals WHERE total_cost = 98.75), 98.75, 'points', 'PAY-2024123020150003', NULL, 'completed', 'Battery rental payment using EcoCredits', '2024-12-30 20:16:00'),
(UUID(), (SELECT id FROM users WHERE email = 'sarah.wilson@email.com'), (SELECT id FROM battery_rentals WHERE total_cost = 75.00), 75.00, 'mpesa', 'PAY-2024122916200004', 'RK45HJ7892', 'completed', 'Battery rental payment - ECOS-BAT-006', '2024-12-29 16:21:00'),
(UUID(), (SELECT id FROM users WHERE email = 'david.johnson@email.com'), NULL, 50.00, 'mpesa', 'PAY-2025010206000005', 'RK45HJ7893', 'completed', 'Account top-up', '2025-01-02 06:01:00');

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Rental cost calculator
CREATE PROCEDURE CalculateRentalCost(
    IN rental_id CHAR(36),
    OUT calculated_cost DECIMAL(10, 2)
)
BEGIN
    DECLARE base_cost DECIMAL(10, 2);
    DECLARE hourly_rate DECIMAL(10, 2);
    DECLARE hours_used DECIMAL(10, 2);
    
    SELECT br.base_cost, br.hourly_rate,
           TIMESTAMPDIFF(MINUTE, br.start_time, COALESCE(br.end_time, NOW())) / 60
    INTO base_cost, hourly_rate, hours_used
    FROM battery_rentals br
    WHERE br.id = rental_id;
    
    SET calculated_cost = base_cost + (hourly_rate * hours_used);
END //

-- Fix battery rental links
CREATE PROCEDURE UpdateBatteryRental(
    IN source_code VARCHAR(50),
    IN target_code VARCHAR(50)
)
BEGIN
    DECLARE rentalId CHAR(36);

    SELECT br.id INTO rentalId
    FROM battery_rentals br
    JOIN batteries b ON b.id = br.battery_id
    WHERE b.battery_code = source_code
    ORDER BY br.id DESC
    LIMIT 1;

    UPDATE batteries
    SET current_rental_id = rentalId
    WHERE battery_code = target_code;
END //

-- Update user stats
CREATE PROCEDURE UpdateUserStats(IN user_id CHAR(36))
BEGIN
    UPDATE user_profiles up
    SET 
        total_swaps = (SELECT COUNT(*) FROM battery_rentals WHERE user_id = up.user_id AND status = 'completed'),
        total_distance_km = (SELECT COALESCE(SUM(distance_covered_km), 0) FROM battery_rentals WHERE user_id = up.user_id AND status = 'completed'),
        total_amount_spent = (SELECT COALESCE(SUM(total_cost), 0) FROM battery_rentals WHERE user_id = up.user_id AND status = 'completed'),
        plastic_recycled_kg = (SELECT COALESCE(SUM(weight_kg), 0) FROM plastic_waste_logs WHERE user_id = up.user_id AND verified = TRUE),
        co2_saved_kg = (SELECT COALESCE(SUM(co2_saved_kg), 0) FROM plastic_waste_logs WHERE user_id = up.user_id AND verified = TRUE),
        total_points_earned = (SELECT COALESCE(SUM(points_earned), 0) FROM plastic_waste_logs WHERE user_id = up.user_id AND verified = TRUE)
    WHERE up.user_id = user_id;
END //

DELIMITER ;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT battery_code, current_rental_id
FROM batteries
WHERE battery_code IN ('ECOS-BAT-004', 'ECOS-BAT-007');

SELECT 'SETUP COMPLETE - DATABASE SUMMARY' AS message;
