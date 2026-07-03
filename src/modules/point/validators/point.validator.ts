import { z } from "zod"
import { PointType } from "../point.enum"

export const CreatePointValidator = z.object({
    customerServiceId: z.number().min(1, "Customer Service ID is required"),
    userId: z.number().min(1, "User ID is required"),
    price: z.number().min(0),
    point: z.number().min(0),
    type: z.enum(Object.values(PointType) as [string, ...string[]])
})

export type CreatePointValidator = z.infer<typeof CreatePointValidator>
