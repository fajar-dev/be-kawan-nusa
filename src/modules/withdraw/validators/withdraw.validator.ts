import { z } from "zod"

export const WithdrawalValidator = z.object({
    point: z.number().min(1, "Points must be at least 1"),
})

export type WithdrawalValidator = z.infer<typeof WithdrawalValidator>
