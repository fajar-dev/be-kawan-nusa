import { AppDataSource } from './config/database'
import { createApp } from './app'
import { config } from './config/config'
import { logger } from './core/helpers/logger'

// Initialize database connection
AppDataSource.initialize()
    .then(() => logger.info("Database connected", { event: "startup.db" }))
    .catch((err) => logger.error("Database connection failed", { event: "startup.db", error: err?.message, stack: err?.stack }))

// Create and configure the application
const app = createApp()

export default {
    port: config.app.port,
    fetch: app.fetch,
}

// Export app instance for testing
export { app }
