import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { swaggerUI } from '@hono/swagger-ui'
import routes from './routes/api'
import { ApiResponse } from './core/helpers/response'
import { BaseException, ValidatorException } from './core/exceptions/base'
import { ZodError } from 'zod'
import { config } from './config/config'
import { logError } from './core/helpers/logger'
import { requestLogger } from './core/middlewares/logger.middleware'

export function createApp(): Hono {
    const app = new Hono()

    app.use('*', requestLogger)

    // CORS
    app.use('*', cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }))

    // Application Routes
    app.route('/api', routes)

    // Swagger UI
    app.get('/api/swagger.yaml', serveStatic({ path: './swagger.yaml' }))
    app.get('/public/*', serveStatic({ root: './' }))
    app.get('/api/docs', swaggerUI({ url: '/api/swagger.yaml' }))

    // Global Error Handler
    app.onError((err, c) => {
        if (err instanceof ZodError) {
            const valErr = new ValidatorException(err)
            return ApiResponse.error(c, valErr.message, valErr.status, valErr.context)
        }

        if (err instanceof BaseException) {
            console.error(`[Exception] ${err.status} - ${err.message}`)
            return ApiResponse.error(c, err.message, err.status, err.context)
        }

        logError(err, { method: c.req.method, path: c.req.path })

        const errors = config.app.env !== "production" ? { 
            message: err.message, 
            stack: err.stack 
        } : null

        return ApiResponse.error(c, "Internal Server Error", 500, errors)
    })

    return app
}
