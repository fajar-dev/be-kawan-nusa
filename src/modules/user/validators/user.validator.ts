import { z } from "zod"

export const UpdateUserStatusValidator = z.object({
    status: z.enum(["active", "reject", "revision"]),
    note: z.string().min(1, "Deskripsi wajib diisi").max(110, "Deskripsi maksimal 110 karakter"),
})
