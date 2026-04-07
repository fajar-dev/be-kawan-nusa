import { z } from "zod"
import { RewardPointType } from "../reward.enum"

export const CreateRewardValidator = z.object({
    customerServiceId: z.number().min(1, "Customer Service ID is required"),
    price: z.number().min(0),
    point: z.number().min(0),
    type: z.enum(Object.values(RewardPointType) as [string, ...string[]])
})

export type CreateRewardValidator = z.infer<typeof CreateRewardValidator>
