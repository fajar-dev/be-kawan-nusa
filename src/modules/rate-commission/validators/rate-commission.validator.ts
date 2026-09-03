import { z } from "zod"
import { PointType } from "../../point/point.enum"
import { RateCommissionValueType } from "../rate-commission.enum"

export const CreateRateCommissionValidator = z.object({
    serviceCode: z.string().min(1, "Service is required"),
    category: z.enum([PointType.OTC, PointType.BULANAN]),
    value: z.number().min(0, "Value must be non-negative"),
    type: z.enum([RateCommissionValueType.PERCENTAGE, RateCommissionValueType.FLAT]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
})

export const UpdateRateCommissionValidator = z.object({
    serviceCode: z.string().min(1).optional(),
    category: z.enum([PointType.OTC, PointType.BULANAN]).optional(),
    value: z.number().min(0, "Value must be non-negative").optional(),
    type: z.enum([RateCommissionValueType.PERCENTAGE, RateCommissionValueType.FLAT]).optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
})

export type CreateRateCommissionValidator = z.infer<typeof CreateRateCommissionValidator>
export type UpdateRateCommissionValidator = z.infer<typeof UpdateRateCommissionValidator>
