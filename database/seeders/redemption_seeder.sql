-- Seeder for Few Realistic Redemptions with highly varied Dates
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE redemptions;
TRUNCATE TABLE redemption_withdraws;
TRUNCATE TABLE redemption_vouchers;
TRUNCATE TABLE redemption_products;
TRUNCATE TABLE redemption_product_shippings;
TRUNCATE TABLE redemption_voucher_details;

-- 1. Insert Redemption Sub-types (User 2: Fajar) with varied timestamps
INSERT INTO redemption_vouchers (id, catalog_id, name, email, created_at, updated_at) VALUES 
(1, 1, 'Fajar Aditya', 'fajarchan@nusa.net.id', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW()),
(2, 4, 'Fajar Aditya', 'fajarchan@nusa.net.id', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW());

INSERT INTO redemption_products (id, catalog_id, name, email, phone, address, created_at, updated_at) VALUES 
(1, 7, 'Fajar Aditya', 'fajarchan@nusa.net.id', '081122334455', 'Jl. Pemuda No. 8, Medan', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW());

INSERT INTO redemption_withdraws (id, bank_name, account_number, account_holder_name, payout, tax, created_at, updated_at) VALUES 
(1, 'BCA', '1234567890', 'Fajar Aditya', 47500.00, 2500.00, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), NOW());

-- 2. Insert Main Redemptions with highly varied dates
INSERT INTO redemptions (id, redemp_no, user_id, points_used, type, status, redemption_voucher_id, created_at, updated_at) VALUES 
(1, CONCAT('RED-', FLOOR(RAND()*99999)), 2, 2000, 'voucher', 'completed', 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 250000) MINUTE), NOW()),
(2, CONCAT('RED-', FLOOR(RAND()*99999)), 2, 1500, 'voucher', 'pending', 2, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 250000) MINUTE), NOW());

INSERT INTO redemptions (id, redemp_no, user_id, points_used, type, status, redemption_product_id, created_at, updated_at) VALUES 
(3, CONCAT('RED-', FLOOR(RAND()*99999)), 2, 3000, 'product', 'processing', 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 250000) MINUTE), NOW());

INSERT INTO redemptions (id, redemp_no, user_id, points_used, type, status, redemption_withdraw_id, created_at, updated_at) VALUES 
(4, CONCAT('RED-', FLOOR(RAND()*99999)), 2, 5000, 'cash', 'completed', 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 250000) MINUTE), NOW());

-- 3. FIFO Consumption
UPDATE rewards SET remaining_point = 0 
WHERE customer_service_id IN (SELECT id FROM customer_services WHERE user_id = 2)
ORDER BY expired_date ASC, created_at ASC
LIMIT 10;

-- 4. Insert Details
INSERT INTO redemption_voucher_details (redemption_voucher_id, code, created_at, updated_at) VALUES 
(1, 'INDO-RND-1', NOW(), NOW()), (2, 'GPAY-RND-2', NOW(), NOW());

INSERT INTO redemption_product_shippings (redemption_product_id, shipper, tracking_number, created_at, updated_at) VALUES 
(1, 'jne', 'JNE-RND-X', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
