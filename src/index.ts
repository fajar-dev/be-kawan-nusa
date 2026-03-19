import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ZodError } from 'zod'
import { AppDataSource } from './config/database'
import api from './routes/api'
import { ApiResponse } from './core/helpers/apiResponse'
import { BaseException } from './core/exceptions/base'
import { config } from './config/config'

const app = new Hono()

// CORS
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Database Connection
AppDataSource.initialize()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection error", err))

// Application Routes
app.route('/api', api)

// Global Error Handler
app.onError((err, c) => {
    console.error(`[Error] ${err.message}`)
    
    if (err instanceof ZodError) {
        return ApiResponse.error(c, "Validation failed", 422, err.format())
    }

    if (err instanceof BaseException) {
        return ApiResponse.error(c, err.message, err.status, err.context)
    }

    return ApiResponse.error(c, "Internal Server Error", 500)
})

export default {
  port: config.app.port,
  fetch: app.fetch,
};
