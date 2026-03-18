import { Context } from 'hono'
import { AuthService } from './auth.service'
import { ApiResponse } from '../../core/helpers/response'
import { RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest } from './auth.request'
import { UserResource } from '../user/user.resource'

export class AuthController {
    private service = new AuthService()

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
            token: data.token,
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

    async forgotPassword(c: Context) {
        const body = await c.req.json() as ForgotPasswordRequest
        const result = await this.service.forgotPassword(body)
        
        return ApiResponse.success(
            c, 
            result, 
            "Password reset instructions have been sent to your email"
        )
    }

    async resetPassword(c: Context) {
        const body = await c.req.json() as ResetPasswordRequest
        await this.service.resetPassword(body)
        
        return ApiResponse.success(c, null, "Password has been successfully reset")
    }
}
