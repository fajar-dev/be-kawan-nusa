import { Context } from "hono"
import { AuthService } from "./auth.service"
import { ApiResponse } from "../../core/helpers/response"
import {
    RegisterValidator,
    LoginValidator,
    ForgotPasswordValidator,
    ResetPasswordValidator,
    RefreshTokenValidator,
    GoogleLoginValidator,
    ResendVerificationValidator,
    SendOtpValidator,
    VerifyOtpValidator,
} from "./validators/auth.validator"
import { AuthSerializer } from "./serializers/auth.serialize"
import { BadRequestException } from "../../core/exceptions/base"

export class AuthController {
    constructor(private readonly service: AuthService) {}

    async register(c: Context) {
        const contentType = c.req.header('content-type') || ''
        const rawBody = contentType.includes('application/json')
            ? await c.req.json()
            : await c.req.parseBody()
        const body = RegisterValidator.parse(rawBody)
        const user = await this.service.register(body)
        return ApiResponse.success(c, await AuthSerializer.single(user, 'user'), "User registered successfully", 201)
    }

    async verifyEmail(c: Context) {
        const token = c.req.query("token")
        if (!token) {
            throw new BadRequestException("Verification token is required")
        }
        const data = await this.service.verifyEmail(token)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(data.user as any, 'user'),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        }, "Email verified successfully")
    }

    async resendVerification(c: Context) {
        const body = await c.req.json() as ResendVerificationValidator
        await this.service.resendVerification(body)
        return ApiResponse.success(c, null, "Verification email sent successfully")
    }

    async checkEmailStatus(c: Context) {
        const email = c.req.query("email")
        const data = await this.service.checkEmailStatus(email || "")
        return ApiResponse.success(c, data)
    }

    async login(c: Context) {
        const body = await c.req.json() as LoginValidator
        const data = await this.service.login(body)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(data.user as any, 'user'),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        }, "Logged in successfully")
    }

    async google(c: Context) {
        const body = await c.req.json() as GoogleLoginValidator
        const data = await this.service.googleLogin(body)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(data.user as any, 'user'),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, 'Logged in successfully')
    }

    async adminGoogle(c: Context) {
        const body = await c.req.json() as GoogleLoginValidator
        const data = await this.service.adminGoogleLogin(body)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(data.employee as any, 'admin'),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, 'Logged in successfully')
    }

    async refreshToken(c: Context) {
        const body = await c.req.json() as RefreshTokenValidator
        const tokens = await this.service.refreshToken(body)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(tokens.user as any, tokens.role as 'user' | 'admin'),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        }, "Token refreshed successfully")
    }

    async me(c: Context) {
        const user = c.get("user")
        const role = c.get("role") as 'user' | 'admin'
        return ApiResponse.success(c, await AuthSerializer.single(user, role), "User profile retrieved successfully")
    }

    async logout(c: Context) {
        const user = c.get("user")
        await this.service.logout(user)
        return ApiResponse.success(c, null, "Logged out successfully")
    }

    async forgotPassword(c: Context) {
        const body = await c.req.json() as ForgotPasswordValidator
        await this.service.forgotPassword(body)
        return ApiResponse.success(c, null, "Password reset instructions have been sent to your email")
    }

    async validateResetToken(c: Context) {
        const token = c.req.query("token")
        if (!token) throw new BadRequestException("Reset token is required")
        await this.service.validateResetToken(token)
        return ApiResponse.success(c, null, "Token is valid")
    }

    async resetPassword(c: Context) {
        const body = await c.req.json() as ResetPasswordValidator
        await this.service.resetPassword(body)
        return ApiResponse.success(c, null, "Password has been successfully reset")
    }

    async sendOtp(c: Context) {
        const body = await c.req.json() as SendOtpValidator
        const data = await this.service.sendOtp(body)
        return ApiResponse.success(c, data, "OTP sent successfully")
    }

    async verifyOtp(c: Context) {
        const body = await c.req.json() as VerifyOtpValidator
        const data = await this.service.verifyOtp(body)
        return ApiResponse.success(c, {
            user: await AuthSerializer.single(data.user as any, 'user'),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        }, "Logged in successfully")
    }
}
