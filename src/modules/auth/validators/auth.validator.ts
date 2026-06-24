import { z } from 'zod'

export const RegisterValidator = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  birthPlace: z.string().min(1, "Birth place is required"),
  identityNumber: z.string().min(16, "Identity number must be 16 digits").max(16, "Identity number must be 16 digits"),
  taxNumber: z.string().min(1, "Tax number is required"),
  email: z.email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  company: z.string().optional(),
  jobPosition: z.string().optional(),
  companyAddress: z.string().optional(),
  isWhatsapp: z.any().optional(),
  identity: z.any()
    .refine((file) => file instanceof File, "Identity document is required")
    .refine((file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024, "Max file size is 5MB")
    .refine(
      (file) => !(file instanceof File) || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      "Only JPG, PNG and GIF are allowed"
    ),
  account: z.any()
    .refine((file) => file instanceof File, "Account book photo is required")
    .refine((file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024, "Max file size is 5MB")
    .refine(
      (file) => !(file instanceof File) || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      "Only JPG, PNG and GIF are allowed"
    ),
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