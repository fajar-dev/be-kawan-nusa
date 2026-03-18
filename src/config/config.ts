import dotenv from 'dotenv'

dotenv.config()

/**
 * Global Application Configuration
 * All environment variables are centralized here
 */
export const config = {
    app: {
        port: Number(process.env.PORT) || 3000,
        env: process.env.NODE_ENV || 'development',
    },
    database: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'kawan_nusa',
    }
}
