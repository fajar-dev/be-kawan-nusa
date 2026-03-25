import { z } from "zod"
import { RewardPointType } from "../reward.enum"

export const CreateRewardValidation = z.object({
    customerServiceId: z.number().min(1, "Customer Service ID is required"),
    price: z.number().min(0),
    point: z.number().min(0),
    paymentDate: z.string().transform((val) => new Date(val)),
    type: z.enum(Object.values(RewardPointType) as [string, ...string[]])
})

export type CreateRewardValidation = z.infer<typeof CreateRewardValidation>
