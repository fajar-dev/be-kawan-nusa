import { z } from "zod"

export const CreateTemplateValidator = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    isActive: z.preprocess((val) => {
        if (val === "true" || val === true || val === "1" || val === 1) return true
        if (val === "false" || val === false || val === "0" || val === 0) return false
        return true
    }, z.boolean().optional().default(true)),
    thumbnail: z.any().optional(),
    png: z.any().optional(),
    jpg: z.any().optional(),
    mp4: z.any().optional(),
    psd: z.any().optional()
})

export const UpdateTemplateValidator = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    isActive: z.preprocess((val) => {
        if (val === "true" || val === true || val === "1" || val === 1) return true
        if (val === "false" || val === false || val === "0" || val === 0) return false
        return undefined
    }, z.boolean().optional()),
    thumbnail: z.any().optional(),
    png: z.any().optional(),
    jpg: z.any().optional(),
    mp4: z.any().optional(),
    psd: z.any().optional()
})

export type CreateTemplateValidator = z.infer<typeof CreateTemplateValidator>
export type UpdateTemplateValidator = z.infer<typeof UpdateTemplateValidator>
