-- Seeder for 30 Unique Customers with Multiple Services and highly varied dates
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE customers;
TRUNCATE TABLE customer_phones;
TRUNCATE TABLE customer_emails;
TRUNCATE TABLE customer_services;
TRUNCATE TABLE rewards;

-- 1. Insert 30 Unique Realistic Customers
INSERT INTO customers (id, name, company, type, registration_date, is_active, created_at, updated_at) VALUES 
('CUST001', 'Budi Santoso', 'PT. Gudang Garam Tbk', 'IT & Telecommunication', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST002', 'Siti Rahmawati', NULL, 'Home User', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST003', 'Andi Wijaya', 'PT. Unilever Indonesia', 'IT & Telecommunication', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST004', 'Eko Prasetyo', 'Toko Berkah Mandiri', 'Wholesale / Supplier / Retail', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST005', 'Maya Indah Sari', 'Universitas Gadjah Mada', 'Education / School / University', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST006', 'Rizal Ramli', 'PT. Jasa Marga', 'Government', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST007', 'Dewi Lestari', NULL, 'Home User', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST008', 'Hendra Kurniawan', 'PT. Bank Mandiri', 'Finance / Banking / Security', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST009', 'Yuni Shara', 'Hotel Mulia Jakarta', 'Hotel', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST010', 'Bambang Pamungkas', 'Bebek Goreng H. Slamet', 'Cafe / Restaurant', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST011', 'Lina Marlina', 'Klinik Sehat Bersama', 'Medication & Pharmacy', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST012', 'Agus Susanto', 'CV. Logistik Lancar', 'Ekspedisi / Export Import / Transportation', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST013', 'Ratna Sari', 'PT. Pertamina', 'Energy / Utility', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST014', 'Doni Tata', 'Bengkel Jaya Motor', 'Automotive', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST015', 'Taufik Hidayat', 'Gelora Bung Karno', 'Sport Venue', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST016', 'Nina Kirana', 'Traveloka Indonesia', 'Travel', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST017', 'Joko Susilo', 'SMK Negeri 1 Jakarta', 'Education / School / University', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST018', 'Puan Maharani', 'DPR RI Office', 'Government', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST019', 'Ridwan Kamil', 'Arsitek Bandung Juara', 'Jasa Konstruksi', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST020', 'Siska Kohl', 'Foodies Creator HQ', 'Cafe / Restaurant', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST021', 'Raffi Ahmad', 'RANS Entertainment', 'Others', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST022', 'Nagita Slavina', 'Mama Gigi Fashion', 'Wholesale / Supplier / Retail', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST023', 'Cinta Laura', 'Yayasan Pendidikan Kita', 'Education / School / University', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST024', 'Deddy Corbuzier', 'Close the Door Podcast', 'Others', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST025', 'Agnez Mo', 'Global Music Indo', 'Others', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST026', 'Jokowi', 'Istana Negara', 'Government', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST027', 'Prabowo Subianto', 'Kemenhan RI', 'Government', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST028', 'Anies Baswedan', 'Indonesia Mengajar', 'Education / School / University', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST029', 'Ganjar Pranowo', 'Provinsi Jawa Tengah', 'Government', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
('CUST030', 'Gibran Rakabuming', 'Markobar Group', 'Cafe / Restaurant', DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 100) DAY), 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW());

-- 2. Insert Multiple Phones/Emails with varied timestamps
INSERT INTO customer_phones (customer_id, phone, label, created_at, updated_at) 
SELECT id, CONCAT('08', LPAD(FLOOR(RAND() * 1000000000), 10, '0')), ELT((m % 5) + 1, 'Pribadi', 'Kantor', 'WhatsApp', 'Darurat', 'Lainnya'), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW() 
FROM customers JOIN (SELECT 1 as m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) nums WHERE (SUBSTRING(id, 5, 3) % 4) >= (m - 1);

INSERT INTO customer_emails (customer_id, email, label, created_at, updated_at) 
SELECT id, CONCAT(LOWER(REPLACE(name, ' ', '.')), m, '@gmail.com'), ELT((m % 5) + 1, 'Pribadi', 'Kantor', 'Tagihan', 'Support', 'Newsletter'), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW() 
FROM customers JOIN (SELECT 1 as m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) nums WHERE (SUBSTRING(id, 5, 3) % 4) >= (m - 1);

-- 3. Insert Multiple Services per Unique Customer (100 total) with highly varied dates
INSERT INTO customer_services (customer_id, service_code, user_id, registration_date, activation_date, address, start_date, reference_date, sales_name, status, created_at, updated_at)
SELECT 
    CONCAT('CUST', LPAD(((n-1) % 30) + 1, 3, '0')) as customer_id,
    ELT(((n-1) % 9) + 1, 'INET-HOME-10', 'INET-HOME-30', 'INET-HOME-50', 'INET-BIZ-50', 'INET-BIZ-100', 'HOST-UNL', 'VPS-BASIC', 'VPN-SECURE', 'COLO-1U') as service_code,
    IF(n % 2 = 0, 2, 1) as user_id,
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 120) DAY) as r_date,
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 120 + 5) DAY) as a_date,
    CONCAT('Jl. Merdeka No. ', FLOOR(RAND() * 999), ', Kel. ', ELT((n % 5) + 1, 'Melati', 'Mawar', 'Anggrek', 'Kamboja', 'Tulip'), ', Jakarta'),
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 120 + 5) DAY),
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 250000) MINUTE),
    ELT(((n-1) % 6) + 1, 'Budi Sales', 'Santi Ningsih', 'Anto Kusuma', 'Rina Octavia', 'Herman Jaya', 'Lia Sari'),
    'Active',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE),
    NOW()
FROM (SELECT a.N + b.N * 10 + 1 as n FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a CROSS JOIN (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b) nums
WHERE n <= 100;

-- 4. Insert Rewards with highly varied timestamps
INSERT INTO rewards (customer_service_id, price, point, expired_date, remaining_point, type, created_at, updated_at)
SELECT 
    id, 
    IF(service_code LIKE 'INET-BIZ%', 1500000, 300000), 
    IF(service_code LIKE 'INET-BIZ%', 2000, 800) + (FLOOR(RAND() * 200)),
    DATE_ADD('2027-01-01', INTERVAL (id % 12) MONTH), 
    IF(service_code LIKE 'INET-BIZ%', 2000, 800) + (FLOOR(RAND() * 200)),
    'otp', 
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 300000) MINUTE),
    NOW()
FROM customer_services;

SET FOREIGN_KEY_CHECKS = 1;
