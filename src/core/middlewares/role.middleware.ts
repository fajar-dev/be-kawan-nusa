import { Context, Next } from 'hono'
import { ForbiddenException, UnauthorizedException } from '../exceptions/base'

/**
 * Middleware factory to restrict access based on role.
 * Must be used AFTER authMiddleware.
 * 
 * Usage: roleMiddleware('admin') or roleMiddleware('user')
 */
export const roleMiddleware = (...roles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user')
        const role = c.get('role') as string | undefined

        if (!user) {
            throw new UnauthorizedException("User not authenticated")
        }

        if (!role || !roles.includes(role)) {
            throw new ForbiddenException(`Forbidden access: ${roles.join(' or ')} only`)
        }

        await next()
    }
}
