import "reflect-metadata"
import { DataSource } from "typeorm"
import { config } from "./config"

/**
 * NIS Database Connection (read-only)
 * External MySQL database for syncing customers & services data
 */
export const NisDataSource = new DataSource({
    type: "mysql",
    host: config.nis.host,
    port: config.nis.port,
    username: config.nis.user,
    password: config.nis.pass,
    database: config.nis.name,
    synchronize: false,
    entities: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci",
})
