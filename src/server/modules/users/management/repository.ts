import { prisma } from "@/lib/prisma"
import type { ManagedUser, UserListResult } from "./types"

function mapUser(user: {
  id: string
  username: string
  role: "SUPERADMIN" | "ADMIN" | "JURY"
  createdAt: Date
}): ManagedUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function findUserById(eventId: string, userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, eventId },
    select: { id: true, username: true, role: true, eventId: true, createdAt: true },
  })
}

export async function findUserByUsername(eventId: string, username: string, excludeUserId?: string) {
  return prisma.user.findFirst({
    where: {
      eventId,
      username,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  })
}

export async function countSuperadmins(eventId: string, excludeUserId?: string) {
  return prisma.user.count({
    where: {
      eventId,
      role: "SUPERADMIN",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  })
}

export async function listUsers(eventId: string, options: { search: string; page: number; pageSize: number }): Promise<UserListResult> {
  const { search, page, pageSize } = options
  const skip = (page - 1) * pageSize
  const where = {
    eventId,
    ...(search
      ? {
          OR: [
            { username: { contains: search } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { username: "asc" }],
      skip,
      take: pageSize,
      select: { id: true, username: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: rows.map(mapUser),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

export async function createUser(eventId: string, data: {
  username: string
  role: "SUPERADMIN" | "ADMIN" | "JURY"
  passwordHash: string
}) {
  const user = await prisma.user.create({
    data: {
      eventId,
      username: data.username,
      role: data.role,
      password: data.passwordHash,
    },
    select: { id: true, username: true, role: true, createdAt: true },
  })

  return mapUser(user)
}

export async function updateUser(eventId: string, userId: string, data: {
  username?: string
  role?: "SUPERADMIN" | "ADMIN" | "JURY"
  passwordHash?: string
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.passwordHash !== undefined ? { password: data.passwordHash } : {}),
    },
    select: { id: true, username: true, role: true, eventId: true, createdAt: true },
  })

  if (user.eventId !== eventId) {
    throw new Error("EVENT_MISMATCH")
  }

  return mapUser(user)
}