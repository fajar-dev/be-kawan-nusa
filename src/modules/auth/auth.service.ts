import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import {
    RegisterValidator,
    LoginValidator,
    ForgotPasswordValidator,
    ResetPasswordValidator,
    RefreshTokenValidator,
    GoogleLoginValidator,
} from "./validators/auth.validator"
import { UnauthorizedException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { sign, verify } from "hono/jwt"
import { config } from "../../config/config"
import crypto from "crypto"
import { mail } from "../../core/helpers/mail"
import * as fs from "fs"
import * as path from "path"
import { EntityManager } from "typeorm"
import { UserService } from "../user/user.service"
import { AuthHelper } from "../../core/helpers/auth"

export class AuthService {
    constructor(private readonly userService: UserService) {}

    async register(data: RegisterValidator) {
        if (data.email) {
            const existing = await this.userService.getByEmail(data.email)
            if (existing) {
                throw new BadRequestException("Email already in use")
            }
        }

        return AppDataSource.transaction(async (manager: EntityManager) => {
            return await this.userService.save(
                { ...data, password: await hashPassword(data.password) },
                manager
            )
        })
    }

    async googleLogin(data: GoogleLoginValidator) {
        const payload = await AuthHelper.verifyGoogleCode(data.code)
        const user = await this.userService.getByEmail(payload.email!)

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
        const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user as any
        return { user: safeUser, accessToken, refreshToken }
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

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)

        const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user
        return { user: safeUser, accessToken, refreshToken }
    }

    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: number }
            const user = await this.userService.getById(decoded.sub)

            const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)

            const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user
            return { user: safeUser, accessToken, refreshToken }
        } catch {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }

    async forgotPassword(data: ForgotPasswordValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            throw new BadRequestException("Email not found")
        }

        const resetToken = crypto.randomBytes(32).toString("hex")
        user.resetPasswordToken = resetToken
        user.resetPasswordExpires = new Date(Date.now() + 36000000)

        await this.userService.save(user)

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
        const resetLink = `${config.app.appUrl}/auth/reset-password?email=${user.email}&token=${resetToken}`

        const templatePath = path.join(process.cwd(), "public/templates/forgot-password.html")
        const html = fs.readFileSync(templatePath, "utf8")
            .replace(/{{name}}/g, name)
            .replace(/{{resetLink}}/g, resetLink)

        await mail.sendHtml(user.email!, "Atur Ulang Kata Sandi", html)
        return true
    }

    async resetPassword(data: ResetPasswordValidator) {
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

    async validateResetToken(email: string, token: string) {
        const user = await this.userService.getByEmailAndResetToken(email, token)
        if (!user) {
            throw new BadRequestException("Invalid or expired reset token")
        }
        return true
    }

    async logout(_user: User) {
        return true
    }
}
