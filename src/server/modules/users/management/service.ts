import bcrypt from "bcryptjs"
import { createUser, countActiveSuperadmins, disableUser, findUserById, findUserByUsername, listUsers, updateUser } from "./repository"
import { assertCanManageUsers, ConflictError, NotFoundError } from "./policy"
import type { CurrentUser } from "./types"
import type { CreateUserInput, UpdateUserInput, UserListQuery } from "./validator"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

function shouldBlockSuperadminRemoval(target: { role: string; isActive: boolean }, patch: UpdateUserInput): boolean {
  if (target.role !== "SUPERADMIN" || !target.isActive) return false
  if (patch.isActive === false) return true
  if (patch.role !== undefined && patch.role !== "SUPERADMIN") return true
  return false
}

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
    name: input.name,
    role: input.role,
    passwordHash,
    isActive: input.isActive,
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

  if (shouldBlockSuperadminRemoval(existing, input)) {
    const remaining = await countActiveSuperadmins(EVENT_ID, userId)
    if (remaining === 0) {
      throw new ConflictError("LAST_SUPERADMIN")
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined

  return updateUser(EVENT_ID, userId, {
    ...(input.username !== undefined ? { username: input.username } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(passwordHash !== undefined ? { passwordHash } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  })
}

export async function disableAdminUser(currentUser: CurrentUser | null, userId: string) {
  assertCanManageUsers(currentUser)

  const existing = await findUserById(EVENT_ID, userId)
  if (!existing) {
    throw new NotFoundError("USER_NOT_FOUND")
  }

  if (shouldBlockSuperadminRemoval(existing, { isActive: false })) {
    const remaining = await countActiveSuperadmins(EVENT_ID, userId)
    if (remaining === 0) {
      throw new ConflictError("LAST_SUPERADMIN")
    }
  }

  return disableUser(EVENT_ID, userId)
}