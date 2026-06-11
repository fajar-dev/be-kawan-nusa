import { z } from "zod"

export const CreateEducationCategoryValidator = z.object({
    name: z.string().min(1, "Name is required"),
})

export const UpdateEducationCategoryValidator = z.object({
    name: z.string().min(1, "Name is required"),
})

export type CreateEducationCategoryValidator = z.infer<typeof CreateEducationCategoryValidator>
export type UpdateEducationCategoryValidator = z.infer<typeof UpdateEducationCategoryValidator>
