import { z } from 'zod'

export const CreateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  jobPosition: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  isSubscribe: z.boolean().optional().default(false),
  isAutoWithdraw: z.boolean().optional().default(false),
})

export type CreateUserRequest = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
    password: z.string().min(6).optional()
})

export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>
