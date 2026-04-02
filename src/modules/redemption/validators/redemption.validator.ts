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

export const CreateRedemptionValidator = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(RedemptionType.CASH),
        pointsUsed: z.number().min(1, "Points must be at least 1"),
        notes: z.string().optional(),
        cashDetails: cashDetails
    }),
    z.object({
        type: z.literal(RedemptionType.VOUCHER),
        notes: z.string().optional(),
        voucherDetails: voucherDetails
    }),
    z.object({
        type: z.literal(RedemptionType.PRODUCT),
        notes: z.string().optional(),
        productDetails: productDetails
    })
])

export type CreateRedemptionValidator = z.infer<typeof CreateRedemptionValidator>
