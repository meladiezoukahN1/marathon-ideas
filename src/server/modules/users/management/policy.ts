import type { CurrentUser } from "./types"

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export function assertCanManageUsers(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) {
    throw new ForbiddenError("Authentication required")
  }

  if (user.role !== "SUPERADMIN") {
    throw new ForbiddenError("Superadmin access required")
  }
}