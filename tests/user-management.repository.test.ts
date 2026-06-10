import { prisma } from "@/lib/prisma"
import { createUser, listUsers, updateUser } from "@/server/modules/users/management/repository"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockedPrisma = jest.mocked(prisma)

describe("user management repository", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("lists users without selecting passwordHash", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "admin",
        role: "ADMIN",
        createdAt: new Date("2026-06-09T00:00:00.000Z"),
      } as any,
    ] as any)
    mockedPrisma.user.count.mockResolvedValue(1)

    const result = await listUsers("event-001", { search: "", page: 1, pageSize: 20 })

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { eventId: "event-001" },
      select: expect.objectContaining({
        id: true,
        username: true,
        role: true,
        createdAt: true,
      }),
    }))
    expect(result.data[0]).not.toHaveProperty("passwordHash")
  })

  it("creates users without returning passwordHash", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: "user-2",
      username: "jury6",
      role: "JURY",
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    } as any)

    const result = await createUser("event-001", {
      username: "jury6",
      role: "JURY",
      passwordHash: "hashed",
    })

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        password: "hashed",
      }),
      select: expect.objectContaining({
        id: true,
        username: true,
        role: true,
        createdAt: true,
      }),
    }))
    expect(result).not.toHaveProperty("passwordHash")
  })

  it("updates users without returning passwordHash", async () => {
    mockedPrisma.user.update.mockResolvedValue({
      id: "user-3",
      username: "jury3",
      role: "JURY",
      eventId: "event-001",
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    } as any)

    const result = await updateUser("event-001", "user-3", { username: "jury3-new" })

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        username: "jury3-new",
      }),
      select: expect.objectContaining({
        id: true,
        username: true,
        role: true,
        eventId: true,
        createdAt: true,
      }),
    }))
    expect(result).not.toHaveProperty("passwordHash")
  })
})