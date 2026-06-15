import { z } from "zod"

export const CreateCatalogCategoryValidator = z.object({
    name: z.string().min(1, "Name is required"),
})

export const UpdateCatalogCategoryValidator = z.object({
    name: z.string().min(1, "Name is required"),
})

export type CreateCatalogCategoryValidator = z.infer<typeof CreateCatalogCategoryValidator>
export type UpdateCatalogCategoryValidator = z.infer<typeof UpdateCatalogCategoryValidator>
