-- Seeder for Users (Only 2 Users) with highly varied dates
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE users;

INSERT INTO users (id, first_name, last_name, email, phone, password, company, job_position, photo, account_holder_name, bank_name, account_number, is_subscribe, is_auto_withdraw, created_at, updated_at) VALUES 
(1, 'Admin', 'Kawan Nusa', 'admin@kawannusa.id', '081234567890', '$2a$10$7E7E7E7E7E7E7E7E7E7E7u7E7E7E7E7E7E7E7E7E7E7E7E7E7E7E', 'Nusanet', 'Administrator', 'uploads/profiles/admin.jpg', 'Admin Kawan Nusa', 'BCA', '9999999999', 0, 0, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW()),
(2, 'Fajar', 'Aditya', 'fajarchan@nusa.net.id', '081122334455', '$2a$10$7E7E7E7E7E7E7E7E7E7E7u7E7E7E7E7E7E7E7E7E7E7E7E7E7E7E', 'Creative Digital', 'Content Creator', 'uploads/profiles/fajar.jpg', 'Fajar Aditya', 'BCA', '1234567890', 1, 1, DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 100000) MINUTE), NOW());

SET FOREIGN_KEY_CHECKS = 1;
