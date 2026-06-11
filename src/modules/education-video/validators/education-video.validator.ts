import { z } from "zod"

export const CreateEducationVideoValidator = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Invalid URL format").min(1, "URL is required"),
    description: z.string().optional(),
    author: z.string().optional(),
    categoryId: z.preprocess((val) => Number(val), z.number().min(1, "Category ID must be a valid number")),
    thumbnail: z.any().optional()
})

export const UpdateEducationVideoValidator = z.object({
    title: z.string().min(1, "Title is required").optional(),
    url: z.string().url("Invalid URL format").min(1, "URL is required").optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    categoryId: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(1, "Category ID must be a valid number").optional()),
    thumbnail: z.any().optional()
})

export type CreateEducationVideoValidator = z.infer<typeof CreateEducationVideoValidator>
export type UpdateEducationVideoValidator = z.infer<typeof UpdateEducationVideoValidator>
