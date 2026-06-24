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

export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly employeeService: EmployeeService,
        private readonly authTokenService: AuthTokenService,
        private readonly unitOfWork: IUnitOfWork,
        private readonly mailHelper: Mail,
        private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
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
            return await this.userService.save(
                {
                    ...userData,
                    identityNumber: identityNumber ? Number(identityNumber) : undefined,
                    identityPath,
                    accountPath,
                    isActive: false,
                },
                manager
            )
        })
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

        await this.mailHelper.sendHtml(user.email!, "Atur Ulang Kata Sandi", html)
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
        this.passwordResetTokenRepository.deleteAllByUserId(user.id)

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

