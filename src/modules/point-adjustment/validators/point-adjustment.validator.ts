import { z } from "zod"

export const CreatePointAdjustmentValidator = z.object({
    pointSubmissionId: z.coerce.number().int().positive(),
    toValue: z.coerce.number().positive("Nilai komisi baru harus lebih dari 0"),
    reason: z.string().trim().min(1, "Alasan penyesuaian wajib diisi"),
})

export type CreatePointAdjustmentValidator = z.infer<typeof CreatePointAdjustmentValidator>

export const ReviewPointAdjustmentValidator = z.object({
    action: z.enum(["approve", "reject"]),
    note: z.string().trim().optional(),
})

export type ReviewPointAdjustmentValidator = z.infer<typeof ReviewPointAdjustmentValidator>

export const ResubmitPointAdjustmentValidator = z.object({
    toValue: z.coerce.number().positive("Nilai komisi baru harus lebih dari 0"),
    reason: z.string().trim().min(1, "Alasan penyesuaian wajib diisi"),
})

export type ResubmitPointAdjustmentValidator = z.infer<typeof ResubmitPointAdjustmentValidator>
