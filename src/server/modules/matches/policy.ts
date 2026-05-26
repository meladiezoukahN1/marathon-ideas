import type { CurrentUser } from "./types"

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export function assertIsAdmin(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) throw new ForbiddenError("Authentication required")
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new ForbiddenError("Admin access required")
  }
}
