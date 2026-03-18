import { z } from 'zod'

const CustomerPhoneSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  label: z.string().optional()
})

const CustomerEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  label: z.string().optional()
})

export const CreateCustomerSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  category: z.string().optional(),
  registrationDate: z.coerce.date().optional(),
  activationDate: z.coerce.date().optional(),
  salesName: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  phones: z.array(CustomerPhoneSchema).optional(),
  emails: z.array(CustomerEmailSchema).optional(),
})

export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  registrationDate: z.coerce.date().optional(),
  activationDate: z.coerce.date().optional(),
  salesName: z.string().optional(),
  isActive: z.boolean().optional(),
  phones: z.array(CustomerPhoneSchema).optional(),
  emails: z.array(CustomerEmailSchema).optional(),
})

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>
