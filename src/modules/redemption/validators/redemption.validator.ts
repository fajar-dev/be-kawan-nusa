import { z } from "zod"
import { RedemptionStatus } from "../redemption.enum"

export const CreateCashRedemptionValidator = z.object({
    pointsUsed: z.number().min(1, "Points must be at least 1"),
    notes: z.string().optional()
})

export const CreateRedemptionVoucherValidator = z.object({
    catalogId: z.number(),
    notes: z.string().optional()
})

export const CreateRedemptionProductValidator = z.object({
    catalogId: z.number(),
    address: z.string().min(1, "Shipping address is required"),
    notes: z.string().optional()
})

export const UpdateRedemptionStatusValidator = z.object({
    status: z.nativeEnum(RedemptionStatus)
})

export type CreateCashRedemptionValidator = z.infer<typeof CreateCashRedemptionValidator>
export type CreateRedemptionVoucherValidator = z.infer<typeof CreateRedemptionVoucherValidator>
export type CreateRedemptionProductValidator = z.infer<typeof CreateRedemptionProductValidator>
export type UpdateRedemptionStatusValidator = z.infer<typeof UpdateRedemptionStatusValidator>
