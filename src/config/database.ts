import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { User } from "../modules/user/entities/user.entity"
import { Reward } from "../modules/reward/entities/reward.entity"
import { Catalog } from "../modules/catalog/entities/catalog.entity"
import { CatalogCategory } from "../modules/catalog-category/entities/catalog-category.entity"
import { Redemption } from "../modules/redemption/entities/redemption.entity"
import { WithdrawRedemption } from "../modules/redemption/entities/withdraw-redemption.entity"
import { VoucherRedemption } from "../modules/redemption/entities/voucher-redemption.entity"
import { ProductRedemption } from "../modules/redemption/entities/product-redemption.entity"
import { ProductRedemptionShipping } from "../modules/redemption/entities/product-redemption-shipping.entity"
import { VoucherRedemptionDetail } from "../modules/redemption/entities/voucher-redemption-detail.entity"
import { config } from "./config"

/**
 * TypeORM Database Configuration
 * Uses centralized config from config.ts
 */
export const AppDataSource = new DataSource({
    type: "mysql",
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    synchronize: config.database.sync,
    entities: [Customer, CustomerPhone, CustomerEmail, Service, CustomerService, User, Reward, Catalog, CatalogCategory, Redemption, WithdrawRedemption, VoucherRedemption, ProductRedemption, ProductRedemptionShipping, VoucherRedemptionDetail],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci"
})
