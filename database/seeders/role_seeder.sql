-- Seeder for Default Admin Role
-- Creates a default admin role with all permissions and assigns it to employee 0202589

SET FOREIGN_KEY_CHECKS = 0;

-- Insert Admin role with all permissions
INSERT INTO roles (id, name, description, color, permissions, is_default, created_at, updated_at) VALUES
(1, 'Admin', 'Akses penuh ke semua fitur', '#22c55e',
'{"dashboard":["L"],"user":["L","T","E","H"],"user.approval":["L","T","E","H"],"point-submission":["L","T","E","H"],"point-submission.history":["L","T","E","H"],"point-submission.request":["L","T","E"],"redemption.cash":["L","T","E","H"],"redemption.product":["L","T","E","H"],"redemption.voucher":["L","T","E","H"],"catalog":["L","T","E","H"],"education":["L","T","E","H"],"employee":["L","T","E","H"],"role":["L","T","E","H"]}',
1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    permissions = VALUES(permissions),
    updated_at = NOW();

-- Assign Admin role to employee 0202589 (no-op if that employee doesn't exist)
UPDATE employees SET role_id = 1 WHERE employee_id = '0202589';

SET FOREIGN_KEY_CHECKS = 1;
