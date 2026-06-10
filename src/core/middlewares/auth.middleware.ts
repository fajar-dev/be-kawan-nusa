import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { config } from '../../config/config'
import { AppDataSource } from '../../config/database'
import { User } from '../../modules/user/entities/user.entity'
import { Employee } from '../../modules/employee/entities/employee.entity'
import { UnauthorizedException } from '../exceptions/base'

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException("Missing or invalid authorization header")
    }

    const token = authHeader.split(' ')[1]
    
    try {
        const decoded = await verify(token, config.app.jwtSecret, "HS256") as { sub: number; role?: string }
        const role = decoded.role || 'user'

        let account: User | Employee | null = null

        if (role === 'admin') {
            const employeeRepository = AppDataSource.getRepository(Employee)
            account = await employeeRepository.findOneBy({ id: decoded.sub })
        } else {
            const userRepository = AppDataSource.getRepository(User)
            account = await userRepository.findOneBy({ id: decoded.sub })
        }

        if (!account) {
            throw new UnauthorizedException("Unauthorized access")
        }

        c.set('user', account)
        c.set('role', role)
        await next()
    } catch (error) {
        throw new UnauthorizedException("Invalid or expired token")
    }
}
