import { Hono } from 'hono'
import { ZodError } from 'zod'
import { AppDataSource } from './config/database'
import api from './routes/api'
import { ApiResponse } from './core/helpers/response'
import { BaseException } from './core/exceptions/base'

const app = new Hono()

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

export default app
