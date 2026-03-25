import { z } from "zod"

export const UpdateAccountValidator = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.email("Invalid email format"),
    company: z.string().optional(),
    jobPosition: z.string().optional(),
})

export type UpdateAccountValidator = z.infer<typeof UpdateAccountValidator>

export const UpdateBankValidator = z.object({
    accountHolderName: z.string().min(1, "Account holder name is required"),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
})

export type UpdateBankValidator = z.infer<typeof UpdateBankValidator>

export const UpdatePasswordValidator = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export type UpdatePasswordValidator = z.infer<typeof UpdatePasswordValidator>

export const UpdatePreferenceValidator = z.object({
    isSubscribe: z.boolean().optional(),
    isAutoWithdraw: z.boolean().optional(),
})

export type UpdatePreferenceValidator = z.infer<typeof UpdatePreferenceValidator>

export const UpdatePhotoValidator = z.object({
    photo: z.any()
        .refine((file) => file instanceof File, "Photo file is required")
        .refine((file: File) => file.size <= 5 * 1024 * 1024, "Max file size is 5MB")
        .refine(
            (file: File) => ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
            "Only JPG, PNG and GIF are allowed"
        )
})

export type UpdatePhotoValidator = z.infer<typeof UpdatePhotoValidator>
