import { z } from "zod"

export const CreateRoleValidator = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    color: z.string().optional(),
    permissions: z.record(z.array(z.string())),
    employeeIds: z.array(z.number()).optional(),
})

export const UpdateRoleValidator = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    permissions: z.record(z.array(z.string())).optional(),
    employeeIds: z.array(z.number()).optional(),
})

export type CreateRoleValidator = z.infer<typeof CreateRoleValidator>
export type UpdateRoleValidator = z.infer<typeof UpdateRoleValidator>
