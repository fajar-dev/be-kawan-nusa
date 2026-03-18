import { z } from 'zod'

export const CreateServiceSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["Internet", "Email", "Domain", "Web Hosting", "Data Cloud", "Server", "Jasa", "Business"], {
    error: "Invalid service type"
  }),
  isActive: z.boolean().optional().default(true),
})

export type CreateServiceRequest = z.infer<typeof CreateServiceSchema>

export const UpdateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["Internet", "Email", "Domain", "Web Hosting", "Data Cloud", "Server", "Jasa", "Business"]).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateServiceRequest = z.infer<typeof UpdateServiceSchema>
