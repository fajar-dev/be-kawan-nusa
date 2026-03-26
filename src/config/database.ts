import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { User } from "../modules/user/entities/user.entity"
import { Point } from "../modules/point/entities/point.entity"
import { Reward } from "../modules/reward/entities/reward.entity"
import { Withdraw } from "../modules/withdraw/entities/withdraw.entity"
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
    entities: [Customer, CustomerPhone, CustomerEmail, Service, CustomerService, User, Point, Reward, Withdraw],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci"
})
