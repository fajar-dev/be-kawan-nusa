import { Context } from 'hono'
import { AuthService } from './auth.service'
import { ApiResponse } from '../../core/helpers/response'
import { RegisterValidation, LoginValidation, ForgotPasswordValidation, ResetPasswordValidation, RefreshTokenValidation } from './validations/auth.validation'
import { UserSerializer } from '../user/serializers/user.serialize'
import { BadValidationException } from '../../core/exceptions/base'

export class AuthController {
    private service: AuthService

    constructor() {
        this.service = new AuthService()
    }

    async register(c: Context) {
        const body = await c.req.json() as RegisterValidation
        const user = await this.service.register(body)
        return ApiResponse.success(c, UserSerializer.single(user), "User registered successfully", 201)
    }

    async login(c: Context) {
        const body = await c.req.json() as LoginValidation
        const data = await this.service.login(body)
        return ApiResponse.success(c, {
            user: UserSerializer.single(data.user as any),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, "Logged in successfully")
    }

    async refreshToken(c: Context) {
        const body = await c.req.json() as RefreshTokenValidation
        const tokens = await this.service.refreshToken(body)
        
        return ApiResponse.success(c, tokens, "Token refreshed successfully")
    }

    async me(c: Context) {
        const user = c.get('user')
        return ApiResponse.success(c, UserSerializer.single(user), "User profile retrieved successfully")
    }

    async logout(c: Context) {
        const user = c.get('user')
        await this.service.logout(user)
        return ApiResponse.success(c, null, "Logged out successfully")
    }

    async forgotPassword(c: Context) {
        const body = await c.req.json() as ForgotPasswordValidation
        await this.service.forgotPassword(body)
        return ApiResponse.success(
            c, 
            null,
            "Password reset instructions have been sent to your email"
        )
    }

    async validateResetToken(c: Context) {
        const email = c.req.query('email')
        const token = c.req.query('token')
        if (!token) {
            throw new BadValidationException("Reset token is required")
        }
        if (!email) {
            throw new BadValidationException("Email is required")
        }
        
        await this.service.validateResetToken(email, token)
        
        return ApiResponse.success(c, null, "Token is valid")
    }

    async resetPassword(c: Context) {
        const body = await c.req.json() as ResetPasswordValidation
        await this.service.resetPassword(body)
        
        return ApiResponse.success(c, null, "Password has been successfully reset")
    }
}
