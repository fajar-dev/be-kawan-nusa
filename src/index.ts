import { AppDataSource } from './config/database'
import { createApp } from './app'
import { config } from './config/config'

// Initialize database connection
AppDataSource.initialize()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection error", err))

// Create and configure the application
const app = createApp()

export default {
    port: config.app.port,
    fetch: app.fetch,
}

// Export app instance for testing
export { app }
