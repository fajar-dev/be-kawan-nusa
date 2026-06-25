import { rateLimiter } from 'hono-rate-limiter'
import type { Context } from 'hono'

/**
 * Rate limit middleware - max requests per minute
 * @param limit - Maximum requests allowed per minute
 */
export const rateLimitMiddleware = (limit: number = 5) => {
    return rateLimiter({
        windowMs: 60 * 1000,
        limit,
        standardHeaders: 'draft-6',
        keyGenerator: (c: Context) =>
            c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    })
}
