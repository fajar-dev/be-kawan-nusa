-- Master Seeder for Kawan Nusa
-- Run this file to seed all data in the correct order

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Base Tables (No foreign keys or independent)
SOURCE database/seeders/users_seeder.sql;
SOURCE database/seeders/catalog_seeder.sql;
SOURCE database/seeders/education_seeder.sql;

-- 2. Service-related (Depends on Services)
SOURCE database/seeders/template_promotion_seeder.sql;

-- 3. Customer-related (Depends on Customers, Services, and Users)
SOURCE database/seeders/customers_seeder.sql;

-- 4. Redemption-related (Depends on Users, Catalogs)
SOURCE database/seeders/redemption_seeder.sql;

SET FOREIGN_KEY_CHECKS = 1;
