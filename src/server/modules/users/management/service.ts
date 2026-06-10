import bcrypt from "bcryptjs"
import { createUser, countSuperadmins, findUserById, findUserByUsername, listUsers, updateUser } from "./repository"
import { assertCanManageUsers, ConflictError, NotFoundError } from "./policy"
import type { CurrentUser } from "./types"
import type { CreateUserInput, UpdateUserInput, UserListQuery } from "./validator"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function getUsersForAdmin(currentUser: CurrentUser | null, query: UserListQuery) {
  assertCanManageUsers(currentUser)
  return listUsers(EVENT_ID, query)
}

export async function createAdminUser(currentUser: CurrentUser | null, input: CreateUserInput) {
  assertCanManageUsers(currentUser)

  const existing = await findUserByUsername(EVENT_ID, input.username)
  if (existing) {
    throw new ConflictError("USERNAME_TAKEN")
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  return createUser(EVENT_ID, {
    username: input.username,
    role: input.role,
    passwordHash,
  })
}

export async function patchAdminUser(currentUser: CurrentUser | null, userId: string, input: UpdateUserInput) {
  assertCanManageUsers(currentUser)

  const existing = await findUserById(EVENT_ID, userId)
  if (!existing) {
    throw new NotFoundError("USER_NOT_FOUND")
  }

  if (input.username) {
    const duplicate = await findUserByUsername(EVENT_ID, input.username, userId)
    if (duplicate) {
      throw new ConflictError("USERNAME_TAKEN")
    }
  }

  if (input.role !== undefined && existing.role === "SUPERADMIN" && input.role !== "SUPERADMIN") {
    const remaining = await countSuperadmins(EVENT_ID, userId)
    if (remaining === 0) {
      throw new ConflictError("LAST_SUPERADMIN")
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined

  return updateUser(EVENT_ID, userId, {
    ...(input.username !== undefined ? { username: input.username } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(passwordHash !== undefined ? { passwordHash } : {}),
  })
}