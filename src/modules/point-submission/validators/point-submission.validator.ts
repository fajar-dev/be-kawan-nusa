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
        branchCode: z.string().nullable(),
    }),
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
        branchCode: z.string().nullable(),
    }).optional(),
})

export const ApprovePointSubmissionValidator = z.object({
    ids: z.array(z.number()).min(1, "At least one ID is required"),
    notes: z.string().optional(),
})

export const AdjustScheduleValidator = z.object({
    price: z.number().min(0, "Price must be non-negative").optional(),
    anchorDay: z.number().int().min(1, "anchorDay must be between 1 and 31").max(31, "anchorDay must be between 1 and 31").optional(),
}).refine((data) => data.price !== undefined || data.anchorDay !== undefined, {
    message: "At least one of price or anchorDay must be provided",
})

export type CreatePointSubmissionValidator = z.infer<typeof CreatePointSubmissionValidator>
export type UpdatePointSubmissionValidator = z.infer<typeof UpdatePointSubmissionValidator>
export type ApprovePointSubmissionValidator = z.infer<typeof ApprovePointSubmissionValidator>
