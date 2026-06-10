export type UserRole = "SUPERADMIN" | "ADMIN" | "JURY"

export interface CurrentUser {
  id: string
  role: UserRole
}

export interface ManagedUser {
  id: string
  username: string
  name: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface UserListResult {
  data: ManagedUser[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}