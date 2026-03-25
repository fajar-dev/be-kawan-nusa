import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import { RegisterValidator, LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator, } from "./validators/auth.validator"
import { UnauthorizedException, BadValidatorException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { sign, verify } from "hono/jwt"
import { config } from "../../config/config"
import crypto from "crypto"
import { mail } from "../../core/helpers/mail"
import * as fs from "fs"
import * as path from "path"
import { PointService } from "../point/point.service"
import { EntityManager } from "typeorm"
import { UserService } from "../user/user.service"

export class AuthService {
    private userService: UserService
    private pointService: PointService

    constructor() {
        this.userService = new UserService()
        this.pointService = new PointService()
    }

    async register(data: RegisterValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (user) {
            throw new BadValidatorException("Email already in use")
        }

        return AppDataSource.transaction(async (manager: EntityManager) => {
            const user = await this.userService.save({
                ...data,
                password: await hashPassword(data.password)
            }, manager)

            await this.pointService.create({ userId: user.id }, manager)

            return user
        })
    }

    async login(data: LoginValidator) {
        const user = await this.userService.getByIdentifier(data.identifier)

        if (!user) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const isValid = await comparePassword(data.password, user.password)
        if (!isValid) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const accessToken = await sign(
            { 
                sub: user.id, 
                email: user.email, 
                exp: Math.floor(Date.now() / 1000) + 60 * 15 // 15 mins
            }, 
            config.app.jwtSecret,
            "HS256"
        )

        const refreshToken = await sign(
            { 
                sub: user.id, 
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
            }, 
            config.app.jwtRefreshSecret,
            "HS256"
        )

        user.refreshToken = refreshToken
        await this.userService.save(user)

        const { password, resetPasswordToken, resetPasswordExpires, refreshToken: rfToken, ...userWithoutSensitiveData } = user

        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }

    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: number }
            
            const user = await this.userService.getByIdWithRefreshToken(decoded.sub)
            
            if (!user || user.refreshToken !== data.refreshToken) {
                throw new UnauthorizedException("Invalid refresh token")
            }

            const newToken = await sign(
                { 
                    sub: user.id, 
                    email: user.email, 
                    exp: Math.floor(Date.now() / 1000) + 60 * 15 // 15 mins
                }, 
                config.app.jwtSecret,
                "HS256"
            )

            const newRefreshToken = await sign(
                { 
                    sub: user.id, 
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
                }, 
                config.app.jwtRefreshSecret,
                "HS256"
            )

            user.refreshToken = newRefreshToken
            await this.userService.save(user)

            const { password, resetPasswordToken, resetPasswordExpires, refreshToken: rfToken, ...userWithoutSensitiveData } = user

            return { user: userWithoutSensitiveData, accessToken: newToken, refreshToken: newRefreshToken }
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }

    async forgotPassword(data: ForgotPasswordValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            throw new BadValidatorException("Email not found")
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        user.resetPasswordToken = resetToken
        user.resetPasswordExpires = new Date(Date.now() + 36000000) // 1 hour

        await this.userService.save(user)
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'
        const resetLink = `${config.app.feUrl}/auth/reset-password?email=${user.email}&token=${resetToken}`
        
        const templatePath = path.join(process.cwd(), 'public/templates/forgot-password.html')
        const html = fs.readFileSync(templatePath, 'utf8')
            .replace(/{{name}}/g, name)
            .replace(/{{resetLink}}/g, resetLink)

        await mail.sendHtml(
            user.email,
            "Atur Ulang Kata Sandi",
            html
        )        
        return true
    }

    async resetPassword(data: ResetPasswordValidator) {
        const user = await this.userService.getByResetToken(data.token)
        
        if (!user) {
            throw new BadValidatorException("Invalid or expired reset token")
        }

        user.password = await hashPassword(data.newPassword)
        user.resetPasswordToken = null as any
        user.resetPasswordExpires = null as any

        await this.userService.save(user)
        return true
    }

    async validateResetToken(email:string, token:string) {
        const user = await this.userService.getByEmailAndResetToken(email, token)
        
        if (!user) {
            throw new BadValidatorException("Invalid or expired reset token")
        }

        return true
    }

    async logout(user: User) {
        user.refreshToken = null as any
        await this.userService.save(user)
        return true
    }
}
