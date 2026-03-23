import { z } from "zod"

export const WithdrawalSchema = z.object({
    point: z.number().min(1, "Points must be at least 1"),
})

export type WithdrawalRequest = z.infer<typeof WithdrawalSchema>
