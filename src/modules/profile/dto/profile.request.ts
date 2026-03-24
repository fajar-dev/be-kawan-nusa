import { z } from "zod"

export const UpdateAccountSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.email("Invalid email format"),
    company: z.string().optional(),
    jobPosition: z.string().optional(),
})

export type UpdateAccountRequest = z.infer<typeof UpdateAccountSchema>

export const UpdateBankSchema = z.object({
    accountHolderName: z.string().min(1, "Account holder name is required"),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
})

export type UpdateBankRequest = z.infer<typeof UpdateBankSchema>

export const UpdatePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordSchema>

export const UpdatePreferenceSchema = z.object({
    isSubscribe: z.boolean().optional(),
    isAutoWithdraw: z.boolean().optional(),
})

export type UpdatePreferenceRequest = z.infer<typeof UpdatePreferenceSchema>

export const UpdatePhotoSchema = z.object({
    photo: z.any()
        .refine((file) => file instanceof File, "Photo file is required")
        .refine((file: File) => file.size <= 1 * 1024 * 1024, "Max file size is 5MB")
        .refine(
            (file: File) => ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
            "Only JPG, PNG and GIF are allowed"
        )
})

export type UpdatePhotoRequest = z.infer<typeof UpdatePhotoSchema>
