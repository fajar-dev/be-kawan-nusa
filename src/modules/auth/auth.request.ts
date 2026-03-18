import { z } from 'zod'
import { CreateUserSchema } from '../user/user.request'

export const RegisterSchema = CreateUserSchema

export type RegisterRequest = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export type LoginRequest = z.infer<typeof LoginSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
})

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>
