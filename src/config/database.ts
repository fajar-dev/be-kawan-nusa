import "reflect-metadata"
import { DataSource } from "typeorm"
import dotenv from "dotenv"
import { Service } from "../modules/service/service.entity"

dotenv.config()

/**
 * TypeORM Database Configuration
 * Best practice: Use centralized config with environment variables fallback
 */
export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "kawan_nusa",
    synchronize: process.env.NODE_ENV !== "production", // Auto-sync ONLY in development
    logging: process.env.NODE_ENV !== "production",
    entities: [Service],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci"
})
