import { Context, Next } from "hono"
import { config } from "../../config/config"

/**
 * Optional pre-auth step for routes that should accept EITHER a normal admin
 * JWT OR a system `x-api-key` header, treating the api-key caller as a
 * super-admin. Place this BEFORE authMiddleware/permissionMiddleware in the
 * route's middleware list — those two skip their own checks when they see
 * c.get('isApiKeyAuth') set here, and roleMiddleware('admin') passes normally
 * since c.get('role')/c.get('user') are already set.
 *
 * c.get('user') is a synthetic sentinel, not a real Employee row — only use
 * this on routes whose controller doesn't rely on the caller's actual
 * identity (e.g. attributing writes via admin.id).
 *
 * Never rejects on its own: with no/invalid key it just falls through so the
 * normal auth chain still runs.
 */
export const apiKeyAdminMiddleware = async (c: Context, next: Next) => {
    const apiKey = c.req.header('x-api-key')
    if (apiKey && apiKey === config.app.apiKey) {
        c.set('user', { id: 0, name: 'System' })
        c.set('role', 'admin')
        c.set('isApiKeyAuth', true)
    }
    await next()
}
