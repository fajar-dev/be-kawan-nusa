import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import { RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest, } from "./dto/auth.request"
import { UnauthorizedException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { sign, verify } from "hono/jwt"
import { config } from "../../config/config"
import crypto from "crypto"
import { mail } from "../../core/helpers/mailSender"

export class AuthService {
    private repository = AppDataSource.getRepository(User)

    async register(data: RegisterRequest) {
        // Check if email already exists
        const existing = await this.repository.findOneBy({ email: data.email })
        if (existing) {
            throw new BadRequestException("Email already in use")
        }
        
        const hashedPassword = await hashPassword(data.password)
        const user = this.repository.create({
            ...data,
            password: hashedPassword
        })
        return await this.repository.save(user)
    }

    async login(data: LoginRequest) {
        const user = await this.repository.createQueryBuilder("user")
            .where("user.email = :identifier OR user.phone = :identifier", { identifier: data.identifier })
            .addSelect("user.password")
            .getOne()

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
        await this.repository.save(user)

        // Remove passwords and tokens before returning
        const { password, resetPasswordToken, resetPasswordExpires, refreshToken: rfToken, ...userWithoutSensitiveData } = user

        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }

    async refreshToken(data: RefreshTokenRequest) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: number }
            
            const user = await this.repository.createQueryBuilder("user")
                .where("user.id = :id", { id: decoded.sub })
                .addSelect("user.refreshToken")
                .getOne()
            
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
            await this.repository.save(user)

            return { accessToken: newToken, refreshToken: newRefreshToken }
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }

    async forgotPassword(data: ForgotPasswordRequest) {
        const user = await this.repository.findOneBy({ email: data.email })
        if (!user) {
            // Standard practice: don't reveal if user exists to prevent email enumeration
            return true
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        user.resetPasswordToken = resetToken
        user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hour

        await this.repository.save(user)

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
        // Cannot use findOneBy with Date comparison directly, using query builder
        const user = await this.repository.createQueryBuilder("user")
            .where("user.reset_password_token = :token", { token: data.token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
        
        if (!user) {
            throw new BadRequestException("Invalid or expired reset token")
        }

        user.password = await hashPassword(data.newPassword)
        user.resetPasswordToken = null as any
        user.resetPasswordExpires = null as any

        await this.repository.save(user)
        return true
    }

    async validateResetToken(email:string, token:string) {
        const user = await this.repository.createQueryBuilder("user")
            .where("user.email = :email", { email })
            .andWhere("user.reset_password_token = :token", { token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
        
        if (!user) {
            throw new BadRequestException("Invalid or expired reset token")
        }

        return true
    }

    async logout(user: User) {
        user.refreshToken = null as any
        await this.repository.save(user)
        return true
    }
}
