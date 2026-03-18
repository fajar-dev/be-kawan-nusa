import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "../modules/customer/customer.entity"
import { CustomerPhone } from "../modules/customer/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/customer-email.entity"
import { Service } from "../modules/service/service.entity"
import { User } from "../modules/user/user.entity"
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
    synchronize: config.app.env !== "production",
    logging: config.app.env !== "production",
    entities: [Customer, CustomerPhone, CustomerEmail, Service, User],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci"
})
