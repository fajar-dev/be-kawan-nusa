import { z } from "zod"

export const CreateEducationArticleValidator = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    author: z.string().optional(),
    categoryId: z.preprocess((val) => Number(val), z.number().min(1, "Category ID must be a valid number")),
    image: z.any().optional()
})

export const UpdateEducationArticleValidator = z.object({
    title: z.string().min(1, "Title is required").optional(),
    content: z.string().min(1, "Content is required").optional(),
    author: z.string().optional(),
    categoryId: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(1, "Category ID must be a valid number").optional()),
    image: z.any().optional()
})

export type CreateEducationArticleValidator = z.infer<typeof CreateEducationArticleValidator>
export type UpdateEducationArticleValidator = z.infer<typeof UpdateEducationArticleValidator>
