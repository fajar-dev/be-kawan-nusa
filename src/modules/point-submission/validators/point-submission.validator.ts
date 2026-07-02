import { z } from "zod"
import { PointType } from "../../point/point.enum"

export const CreatePointSubmissionValidator = z.object({
    userId: z.number().min(1, "User ID is required"),
    type: z.enum([PointType.OTC, PointType.BULANAN]),
    price: z.number().min(0, "Price must be non-negative"),
    nisData: z.object({
        custServId: z.number(),
        custId: z.string(),
        accountName: z.string(),
        serviceCode: z.string(),
        serviceName: z.string(),
        accountManager: z.string().nullable(),
        salesEmployeeId: z.string().nullable(),
    }),
    isRecurring: z.boolean().optional().default(false),
    recurringEndDate: z.string().nullable().optional(),
})

export const UpdatePointSubmissionValidator = z.object({
    type: z.enum([PointType.OTC, PointType.BULANAN]).optional(),
    price: z.number().min(0).optional(),
    nisData: z.object({
        custServId: z.number(),
        custId: z.string(),
        accountName: z.string(),
        serviceCode: z.string(),
        serviceName: z.string(),
        accountManager: z.string().nullable(),
        salesEmployeeId: z.string().nullable(),
    }).optional(),
    isRecurring: z.boolean().optional(),
    recurringEndDate: z.string().nullable().optional(),
})

export const ApprovePointSubmissionValidator = z.object({
    ids: z.array(z.number()).min(1, "At least one ID is required"),
    notes: z.string().optional(),
})

export type CreatePointSubmissionValidator = z.infer<typeof CreatePointSubmissionValidator>
export type UpdatePointSubmissionValidator = z.infer<typeof UpdatePointSubmissionValidator>
export type ApprovePointSubmissionValidator = z.infer<typeof ApprovePointSubmissionValidator>
