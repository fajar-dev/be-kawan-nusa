import { z } from 'zod'
import { ServiceType } from '../service.enum'

export const CreateServiceSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ServiceType, {
    error: "Invalid service type"
  }),
  isActive: z.boolean().optional().default(true),
})

export type CreateServiceRequest = z.infer<typeof CreateServiceSchema>

export const UpdateServiceSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ServiceType).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateServiceRequest = z.infer<typeof UpdateServiceSchema>
