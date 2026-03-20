import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import { RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest, } from "./dto/auth.request"
import { UnauthorizedException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { sign, verify } from "hono/jwt"
import { config } from "../../config/config"
import crypto from "crypto"
import { mail } from "../../core/helpers/mailSender"
import { PointService } from "../point/point.service"
import { EntityManager } from "typeorm"
import { UserService } from "../user/user.service"

export class AuthService {
    private userService = new UserService()
    private pointService = new PointService()

    async register(data: RegisterRequest) {
        const user = await this.userService.getByEmail(data.email)
        if (user) {
            throw new BadRequestException("Email already in use")
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

    async login(data: LoginRequest) {
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

    async refreshToken(data: RefreshTokenRequest) {
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

    async forgotPassword(data: ForgotPasswordRequest) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            return true
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        user.resetPasswordToken = resetToken
        user.resetPasswordExpires = new Date(Date.now() + 36000000) // 1 hour

        await this.userService.save(user)
        // Send actual email
        // await mail.sendHtml(
        //     user.email,
        //     "Password Reset Request",
        //     `<h1>Password Reset</h1>
        //      <p>You requested a password reset. Use the token below to reset your password:</p>
        //      <p><strong>${resetToken}</strong></p>
        //      <p>This token will expire in 1 hour.</p>`
        // )
        console.log(`http://localhost:3000/auth/reset-password?email=${user.email}&token=${resetToken}`)
        
        return true
    }

    async resetPassword(data: ResetPasswordRequest) {
        const user = await this.userService.getByResetToken(data.token)
        
        if (!user) {
            throw new BadRequestException("Invalid or expired reset token")
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
            throw new BadRequestException("Invalid or expired reset token")
        }

        return true
    }

    async logout(user: User) {
        user.refreshToken = null as any
        await this.userService.save(user)
        return true
    }
}
