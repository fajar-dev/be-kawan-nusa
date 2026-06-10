import { Context, Next } from 'hono'
import { User } from '../../modules/user/entities/user.entity'
import { UnauthorizedException } from '../exceptions/base'

/**
 * Middleware to restrict access to admin users only.
 * Must be used AFTER authMiddleware.
 */
export const adminMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user') as User | undefined

    if (!user) {
        throw new UnauthorizedException("User not authenticated")
    }

    await next()
}
