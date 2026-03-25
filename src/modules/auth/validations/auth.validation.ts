import { z } from 'zod'

export const RegisterValidation = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  jobPosition: z.string().optional(),
  email: z.email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  isSubscribe: z.boolean().optional().default(false),
  isAutoWithdraw: z.boolean().optional().default(false),
})

export type RegisterValidation = z.infer<typeof RegisterValidation>

export const LoginValidation = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValidation = z.infer<typeof LoginValidation>

export const ForgotPasswordValidation = z.object({
  email: z.email("Invalid email format"),
})

export type ForgotPasswordValidation = z.infer<typeof ForgotPasswordValidation>

export const ResetPasswordValidation = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export type ResetPasswordValidation = z.infer<typeof ResetPasswordValidation>

export const RefreshTokenValidation = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export type RefreshTokenValidation = z.infer<typeof RefreshTokenValidation>
