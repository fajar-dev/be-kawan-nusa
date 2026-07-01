import { z } from "zod"
import { CatalogType } from "../catalog.enum"

export const CreateCatalogValidator = z.object({
    name: z.string().min(1, "Name is required"),
    categoryId: z.preprocess((val) => Number(val), z.number().min(1, "Category ID must be a valid number")),
    type: z.enum(CatalogType).optional().default(CatalogType.PRODUCT),
    description: z.string().optional(),
    point: z.preprocess((val) => val ? Number(val) : 0, z.number().min(0, "Point must be a positive number")),
    expiredDate: z.string().optional(),
    stock: z.preprocess((val) => val !== undefined && val !== "" ? Number(val) : undefined, z.number().int().min(0, "Stock must be a non-negative number")),
    image: z.any().optional()
})

export const UpdateCatalogValidator = z.object({
    name: z.string().min(1, "Name is required").optional(),
    categoryId: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(1, "Category ID must be a valid number").optional()),
    type: z.enum(CatalogType).optional(),
    description: z.string().optional(),
    point: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(0, "Point must be a positive number").optional()),
    expiredDate: z.string().optional(),
    stock: z.preprocess((val) => {
        if (val === undefined) return undefined
        return Number(val)
    }, z.number().int().min(0, "Stock must be a non-negative number").optional()),
    image: z.any().optional()
})

export type CreateCatalogValidator = z.infer<typeof CreateCatalogValidator>
export type UpdateCatalogValidator = z.infer<typeof UpdateCatalogValidator>
