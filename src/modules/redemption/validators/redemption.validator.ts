import { z } from "zod"
import { Shipper } from "../redemption.enum"

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

export const ProcessProductRedemptionValidator = z.object({
    shipper: z.enum(Shipper),
    trackingNumber: z.string().min(1, "Tracking number is required"),
})

export const ProcessVoucherRedemptionValidator = z.object({
    code: z.string().min(1, "Voucher code is required"),
    expiredDate: z.string().optional(),
})

export type CreateCashRedemptionValidator = z.infer<typeof CreateCashRedemptionValidator>
export type CreateRedemptionVoucherValidator = z.infer<typeof CreateRedemptionVoucherValidator>
export type CreateRedemptionProductValidator = z.infer<typeof CreateRedemptionProductValidator>
export type ProcessProductRedemptionValidator = z.infer<typeof ProcessProductRedemptionValidator>
export type ProcessVoucherRedemptionValidator = z.infer<typeof ProcessVoucherRedemptionValidator>
