import { User } from "../user/entities/user.entity"
import { minio } from "../../core/helpers/minio"
import { Employee } from "../employee/entities/employee.entity"
import {
    RegisterValidator,
    LoginValidator,
    ForgotPasswordValidator,
    ResetPasswordValidator,
    RefreshTokenValidator,
    GoogleLoginValidator,
    ResendVerificationValidator,
} from "./validators/auth.validator"
import { UnauthorizedException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { verify } from "hono/jwt"
import { config } from "../../config/config"
import crypto from "crypto"
import * as fs from "fs"
import * as path from "path"
import { UserService } from "../user/user.service"
import { EmployeeService } from "../employee/employee.service"
import { AuthTokenService } from "../../core/helpers/auth"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { Mail } from "../../core/helpers/mail"
import { IPasswordResetTokenRepository } from "./interfaces/password-reset-token.repository.interface"
import { IEmailVerificationTokenRepository } from "./interfaces/email-verification-token.repository.interface"

export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly employeeService: EmployeeService,
        private readonly authTokenService: AuthTokenService,
        private readonly unitOfWork: IUnitOfWork,
        private readonly mailHelper: Mail,
        private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
        private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    ) {}

    async register(data: RegisterValidator) {
        if (data.email) {
            const existingEmail = await this.userService.getByEmail(data.email)
            if (existingEmail) {
                throw new BadRequestException("Email already in use")
            }
        }

        if (data.phone) {
            const existingPhone = await this.userService.getByIdentifier(data.phone)
            if (existingPhone) {
                throw new BadRequestException("Phone number already in use")
            }
        }

        // Upload identity file (KTP)
        let identityPath: string | undefined
        if (data.identity instanceof File) {
            const rawExt = data.identity.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `identity/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const buffer = Buffer.from(await data.identity.arrayBuffer())
            await minio.upload(filename, buffer, data.identity.type)
            identityPath = filename
        }

        // Upload account file (Buku Rekening)
        let accountPath: string | undefined
        if (data.account instanceof File) {
            const rawExt = data.account.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `account/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const buffer = Buffer.from(await data.account.arrayBuffer())
            await minio.upload(filename, buffer, data.account.type)
            accountPath = filename
        }

        const { identity, account, isWhatsapp, identityNumber, ...userData } = data

        return this.unitOfWork.runInTransaction(async (manager) => {
            const user = await this.userService.save(
                {
                    ...userData,
                    identityNumber: identityNumber ? Number(identityNumber) : undefined,
                    hasWhatsapp: isWhatsapp === 'true' || isWhatsapp === true,
                    identityPath,
                    accountPath,
                    isActive: false,
                    isVerified: false,
                },
                manager
            )

            // Fire-and-forget: don't block registration if email fails
            this.sendVerificationEmail(user).catch((err) => {
                console.error(`[Auth] Failed to send verification email to ${user.email}:`, err)
            })

            return user
        })
    }

    private async sendVerificationEmail(user: User) {
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        await this.emailVerificationTokenRepository.create(user.id, token, expiresAt)

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
        const verifyLink = `${config.app.appUrl}/auth/verify-email?token=${token}`

        const templatePath = path.join(process.cwd(), "public/templates/verify-email.html")
        const html = fs.readFileSync(templatePath, "utf8")
            .replace(/{{name}}/g, name)
            .replace(/{{verifyLink}}/g, verifyLink)

        this.mailHelper.sendHtml(user.email!, "Verifikasi Email Anda", html).catch((err) => {
            console.error(`[Mail] Failed to send verification email to ${user.email}:`, err)
        })
    }

    async verifyEmail(token: string) {
        const verificationToken = await this.emailVerificationTokenRepository.findValidToken(token)
        if (!verificationToken) {
            throw new BadRequestException("Invalid or expired verification token")
        }

        const user = verificationToken.user
        if (user.isVerified) {
            throw new BadRequestException("Email already verified")
        }

        user.isVerified = true
        user.isActive = true
        await this.userService.save(user)
        await this.emailVerificationTokenRepository.deleteAllByUserId(user.id)

        const { accessToken, refreshToken } = await this.authTokenService.generateTokens(user, 'user')

        const { password, ...safeUser } = user as any
        return { user: safeUser, accessToken, refreshToken }
    }

    async resendVerification(data: ResendVerificationValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            throw new BadRequestException("Email not found")
        }

        if (user.isVerified) {
            throw new BadRequestException("Email already verified")
        }

        await this.sendVerificationEmail(user)

        return true
    }

    async checkEmailStatus(email: string) {
        if (!email) {
            throw new BadRequestException("Email is required")
        }

        const user = await this.userService.getByEmail(email)
        if (!user) {
            throw new BadRequestException("Email not found")
        }

        if (user.isVerified) {
            throw new BadRequestException("Email already verified")
        }

        return { needsVerification: true }
    }

    async googleLogin(data: GoogleLoginValidator) {
        const payload = await this.authTokenService.verifyGoogleCode(data.code)
        let user = await this.userService.getByEmail(payload.email!)

        if (!user) {
            throw new BadRequestException("User not registered")
        }

        if (!user.isActive) {
            throw new BadRequestException("Account is inactive")
        }

        const { accessToken, refreshToken } = await this.authTokenService.generateTokens(user, 'user')

        user.lastLoginAt = new Date()
        await this.userService.save({ id: user.id, lastLoginAt: user.lastLoginAt })

        const { password, ...safeUser } = user as any
        return { user: safeUser, accessToken, refreshToken }
    }

    async adminGoogleLogin(data: GoogleLoginValidator) {
        const payload = await this.authTokenService.verifyGoogleCode(data.code)
        const employee = await this.employeeService.getByEmail(payload.email!)

        if (!employee) {
            throw new BadRequestException("Employee not registered")
        }

        if (!employee.isActive) {
            throw new BadRequestException("Account is inactive")
        }

        const { accessToken, refreshToken } = await this.authTokenService.generateTokens(employee, 'admin')
        return { employee, accessToken, refreshToken }
    }

    async login(data: LoginValidator) {
        const user = await this.userService.getByIdentifier(data.identifier)
        if (!user) {
            throw new UnauthorizedException("User not registered")
        }

        if (!user.isVerified) {
            throw new UnauthorizedException("Please verify your email first")
        }

        if (!user.isActive) {
            throw new UnauthorizedException("Account is inactive")
        }

        if (!user.password) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const isValid = await comparePassword(data.password, user.password)
        if (!isValid) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const { accessToken, refreshToken } = await this.authTokenService.generateTokens(user, 'user')

        user.lastLoginAt = new Date()
        await this.userService.save({ id: user.id, lastLoginAt: user.lastLoginAt })

        const { password, ...safeUser } = user
        return { user: safeUser, accessToken, refreshToken }
    }

    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: number; role?: string }
            const role = decoded.role || 'user'

            let account: User | Employee

            if (role === 'admin') {
                account = await this.employeeService.getById(decoded.sub)
            } else {
                account = await this.userService.getById(decoded.sub)
            }

            const { accessToken, refreshToken } = await this.authTokenService.generateTokens(account, role as 'user' | 'admin')

            return { user: account, accessToken, refreshToken, role }
        } catch {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }

    async forgotPassword(data: ForgotPasswordValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            throw new BadRequestException("Email not found")
        }

        if (!user.isVerified) {
            throw new BadRequestException("Please verify your email first")
        }

        if (!user.isActive) {
            throw new BadRequestException("Account is inactive")
        }

        const resetToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 36000000) // 10 hours

        await this.passwordResetTokenRepository.create(user.id, resetToken, expiresAt)

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
        const resetLink = `${config.app.appUrl}/auth/reset-password?token=${resetToken}`

        const templatePath = path.join(process.cwd(), "public/templates/forgot-password.html")
        const html = fs.readFileSync(templatePath, "utf8")
            .replace(/{{name}}/g, name)
            .replace(/{{resetLink}}/g, resetLink)

        this.mailHelper.sendHtml(user.email!, "Atur Ulang Kata Sandi", html).catch((err) => {
            console.error(`[Mail] Failed to send reset password email to ${user.email}:`, err)
        })
        return true
    }

    async resetPassword(data: ResetPasswordValidator) {
        const resetToken = await this.passwordResetTokenRepository.findValidToken(data.token)
        if (!resetToken) {
            throw new BadRequestException("Invalid or expired reset token")
        }

        const user = resetToken.user
        user.password = await hashPassword(data.newPassword)

        await this.userService.save(user)
        await this.passwordResetTokenRepository.deleteAllByUserId(user.id)

        return true
    }

    async validateResetToken(token: string) {
        const resetToken = await this.passwordResetTokenRepository.findValidToken(token)
        if (!resetToken) {
            throw new BadRequestException("Invalid or expired reset token")
        }
        return true
    }

    async logout(_user: User) {
        return true
    }
}

