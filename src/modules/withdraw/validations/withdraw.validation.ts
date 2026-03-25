import { z } from "zod"

export const WithdrawalValidation = z.object({
    point: z.number().min(1, "Points must be at least 1"),
})

export type WithdrawalValidation = z.infer<typeof WithdrawalValidation>
