import { z } from "zod"

export const CreateServicePromotionValidator = z.object({
    serviceCode: z.preprocess((val) => val === "" ? undefined : val, z.string().optional()),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    url: z.string().min(1, "URL is required"),
    startPeriod: z.preprocess((val) => val === "" ? undefined : val, z.string().optional()),
    endPeriod: z.preprocess((val) => val === "" ? undefined : val, z.string().optional()),
    isActive: z.preprocess((val) => {
        if (val === "true" || val === true || val === "1" || val === 1) return true
        if (val === "false" || val === false || val === "0" || val === 0) return false
        return true
    }, z.boolean().optional().default(true)),
    image: z.any().optional()
})

export const UpdateServicePromotionValidator = z.object({
    serviceCode: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    url: z.string().min(1, "URL is required").optional(),
    startPeriod: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    endPeriod: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    isActive: z.preprocess((val) => {
        if (val === "true" || val === true || val === "1" || val === 1) return true
        if (val === "false" || val === false || val === "0" || val === 0) return false
        return undefined
    }, z.boolean().optional()),
    image: z.any().optional()
})

export type CreateServicePromotionValidator = z.infer<typeof CreateServicePromotionValidator>
export type UpdateServicePromotionValidator = z.infer<typeof UpdateServicePromotionValidator>
