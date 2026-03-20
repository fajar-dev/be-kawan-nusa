import { Context } from 'hono'
import { AuthService } from './auth.service'
import { ApiResponse } from '../../core/helpers/apiResponse'
import { RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest } from './dto/auth.request'
import { UserResource } from '../user/dto/user.resource'
import { BadRequestException } from '../../core/exceptions/base'

export class AuthController {
    private service: AuthService

    constructor() {
        this.service = new AuthService()
    }

    async register(c: Context) {
        const body = await c.req.json() as RegisterRequest
        const user = await this.service.register(body)
        return ApiResponse.success(c, UserResource.single(user), "User registered successfully", 201)
    }

    async login(c: Context) {
        const body = await c.req.json() as LoginRequest
        const data = await this.service.login(body)
        return ApiResponse.success(c, {
            user: UserResource.single(data.user as any),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, "Logged in successfully")
    }

    async refreshToken(c: Context) {
        const body = await c.req.json() as RefreshTokenRequest
        const tokens = await this.service.refreshToken(body)
        
        return ApiResponse.success(c, tokens, "Token refreshed successfully")
    }

    async me(c: Context) {
        const user = c.get('user')
        return ApiResponse.success(c, UserResource.single(user), "User profile retrieved successfully")
    }

    async logout(c: Context) {
        const user = c.get('user')
        await this.service.logout(user)
        return ApiResponse.success(c, null, "Logged out successfully")
    }

    async forgotPassword(c: Context) {
        const body = await c.req.json() as ForgotPasswordRequest
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
            throw new BadRequestException("Reset token is required")
        }
        if (!email) {
            throw new BadRequestException("Email is required")
        }
        
        await this.service.validateResetToken(email, token)
        
        return ApiResponse.success(c, null, "Token is valid")
    }

    async resetPassword(c: Context) {
        const body = await c.req.json() as ResetPasswordRequest
        await this.service.resetPassword(body)
        
        return ApiResponse.success(c, null, "Password has been successfully reset")
    }
}
