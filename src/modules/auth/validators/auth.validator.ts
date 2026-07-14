import { z } from 'zod'

export const RegisterValidator = z.object({
  name: z.string().min(1, "Name is required").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  identityNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  company: z.string().optional(),
  jobPosition: z.string().optional(),
  companyAddress: z.string().optional(),
  isWhatsapp: z.any().optional(),
  identity: z.any().optional(),
  account: z.any().optional(),
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

export const GoogleLoginSchema = z.object({
    code: z.string().min(1, 'Code is required'),
})

export type GoogleLoginValidator = z.infer<typeof GoogleLoginSchema>

export const ResendVerificationValidator = z.object({
  email: z.email("Invalid email format"),
})

export type ResendVerificationValidator = z.infer<typeof ResendVerificationValidator>

export const SendOtpValidator = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
})

export type SendOtpValidator = z.infer<typeof SendOtpValidator>

export const VerifyOtpValidator = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  code: z.string().min(6, "OTP code must be 6 digits").max(6, "OTP code must be 6 digits"),
})

export type VerifyOtpValidator = z.infer<typeof VerifyOtpValidator>