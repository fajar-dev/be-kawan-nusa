import { z } from 'zod'

export const RegisterValidator = z.object({
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

export type RegisterValidator = z.infer<typeof RegisterValidator>

export const LoginValidator = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValidator = z.infer<typeof LoginValidator>

export const ForgotPasswordValidator = z.object({
  email: z.email("Invalid email format"),
})

export type ForgotPasswordValidator = z.infer<typeof ForgotPasswordValidator>

export const ResetPasswordValidator = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export type ResetPasswordValidator = z.infer<typeof ResetPasswordValidator>

export const RefreshTokenValidator = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export type RefreshTokenValidator = z.infer<typeof RefreshTokenValidator>
