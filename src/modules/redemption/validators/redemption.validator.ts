import { z } from "zod"
import { RedemptionType } from "../redemption.enum"

const cashDetails = z.object({})

const voucherDetails = z.object({
    catalogId: z.number()
})

const productDetails = z.object({
    catalogId: z.number(),
    address: z.string().min(1, "Shipping address is required")
})

export const CreateCashRedemptionValidator = z.object({
    pointsUsed: z.number().min(1, "Points must be at least 1"),
    notes: z.string().optional()
})

export const CreateVoucherRedemptionValidator = z.object({
    catalogId: z.number(),
    notes: z.string().optional()
})

export const CreateProductRedemptionValidator = z.object({
    catalogId: z.number(),
    address: z.string().min(1, "Shipping address is required"),
    notes: z.string().optional()
})

export type CreateCashRedemptionValidator = z.infer<typeof CreateCashRedemptionValidator>
export type CreateVoucherRedemptionValidator = z.infer<typeof CreateVoucherRedemptionValidator>
export type CreateProductRedemptionValidator = z.infer<typeof CreateProductRedemptionValidator>
