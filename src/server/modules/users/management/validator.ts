import { z } from "zod"

const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/)
const nameSchema = z.string().trim().min(1).max(120).nullable().optional()

export const userListQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const createUserSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  role: z.enum(["SUPERADMIN", "ADMIN", "JURY"]),
  password: z.string().min(8).max(100),
  isActive: z.boolean().optional().default(true),
})

export const updateUserSchema = z.object({
  username: usernameSchema.optional(),
  name: nameSchema,
  role: z.enum(["SUPERADMIN", "ADMIN", "JURY"]).optional(),
  password: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(8).max(100).optional(),
  ),
  isActive: z.boolean().optional(),
}).refine(
  (data) => data.username !== undefined || data.name !== undefined || data.role !== undefined || data.password !== undefined || data.isActive !== undefined,
  { message: "At least one field must be provided" },
)

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>