import { rateLimiter } from 'hono-rate-limiter'
import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { config } from '../../config/config'

/**
 * Rate limit middleware - max requests per minute
 * Disabled in test environment
 * @param limit - Maximum requests allowed per minute
 */
export const rateLimitMiddleware = (limit: number = 5) => {
    if (config.app.env === 'test') {
        return createMiddleware(async (_c, next) => await next())
    }

    return rateLimiter({
        windowMs: 60 * 1000,
        limit,
        standardHeaders: 'draft-6',
        keyGenerator: (c: Context) =>
            c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    })
}
