import bcrypt from "bcryptjs"
import * as repository from "@/server/modules/users/management/repository"
import { ConflictError, ForbiddenError } from "@/server/modules/users/management/policy"
import { createAdminUser, disableAdminUser, patchAdminUser } from "@/server/modules/users/management/service"

jest.mock("@/server/modules/users/management/repository")
jest.mock("bcryptjs")

const mockedRepository = jest.mocked(repository)
const mockedBcrypt = jest.mocked(bcrypt)

describe("user management service", () => {
  const superadmin = { id: "user-1", role: "SUPERADMIN" as const }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("allows SUPERADMIN to create a user and hashes the password", async () => {
    mockedRepository.findUserByUsername.mockResolvedValue(null)
    ;(mockedBcrypt.hash as unknown as jest.Mock).mockResolvedValue("hashed-password")
    mockedRepository.createUser.mockResolvedValue({
      id: "new-user",
      username: "jury6",
      name: "محكم 6",
      role: "JURY",
      isActive: true,
      createdAt: "2026-06-09T00:00:00.000Z",
    } as any)

    const result = await createAdminUser(superadmin, {
      username: "jury6",
      name: "محكم 6",
      role: "JURY",
      password: "Password123",
      isActive: true,
    })

    expect(mockedBcrypt.hash).toHaveBeenCalledWith("Password123", 12)
    expect(mockedRepository.createUser).toHaveBeenCalledWith("event-001", {
      username: "jury6",
      name: "محكم 6",
      role: "JURY",
      passwordHash: "hashed-password",
      isActive: true,
    })
    expect(result.username).toBe("jury6")
  })

  it("rejects ADMIN from creating users", async () => {
    await expect(
      createAdminUser({ id: "user-2", role: "ADMIN" }, {
        username: "jury7",
        role: "JURY",
        password: "Password123",
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it("rejects duplicate usernames", async () => {
    mockedRepository.findUserByUsername.mockResolvedValue({ id: "existing" })

    await expect(
      createAdminUser(superadmin, {
        username: "jury1",
        role: "JURY",
        password: "Password123",
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it("does not hash password when PATCH omits it", async () => {
    mockedRepository.findUserById.mockResolvedValue({
      id: "user-3",
      username: "jury3",
      name: "محكم 3",
      role: "JURY",
      isActive: true,
      eventId: "event-001",
      createdAt: new Date(),
      password: "hashed",
    } as any)
    mockedRepository.updateUser.mockResolvedValue({
      id: "user-3",
      username: "jury3",
      name: "اسم جديد",
      role: "JURY",
      isActive: true,
      createdAt: "2026-06-09T00:00:00.000Z",
    } as any)

    await patchAdminUser(superadmin, "user-3", { name: "اسم جديد" })

    expect(mockedBcrypt.hash).not.toHaveBeenCalled()
    expect(mockedRepository.updateUser).toHaveBeenCalledWith("event-001", "user-3", {
      name: "اسم جديد",
    })
  })

  it("hashes password when PATCH includes it", async () => {
    mockedRepository.findUserById.mockResolvedValue({
      id: "user-4",
      username: "jury4",
      name: "محكم 4",
      role: "JURY",
      isActive: true,
      eventId: "event-001",
      createdAt: new Date(),
      password: "hashed",
    } as any)
    ;(mockedBcrypt.hash as unknown as jest.Mock).mockResolvedValue("new-hash")
    mockedRepository.updateUser.mockResolvedValue({
      id: "user-4",
      username: "jury4",
      name: "محكم 4",
      role: "JURY",
      isActive: true,
      createdAt: "2026-06-09T00:00:00.000Z",
    } as any)

    await patchAdminUser(superadmin, "user-4", { password: "NewPassword123" })

    expect(mockedBcrypt.hash).toHaveBeenCalledWith("NewPassword123", 12)
    expect(mockedRepository.updateUser).toHaveBeenCalledWith("event-001", "user-4", {
      passwordHash: "new-hash",
    })
  })

  it("blocks disabling the last SUPERADMIN", async () => {
    mockedRepository.findUserById.mockResolvedValue({
      id: "user-1",
      username: "superadmin",
      name: "المدير الرئيسي",
      role: "SUPERADMIN",
      isActive: true,
      eventId: "event-001",
      createdAt: new Date(),
      password: "hashed",
    } as any)
    mockedRepository.countActiveSuperadmins.mockResolvedValue(0)

    await expect(disableAdminUser(superadmin, "user-1")).rejects.toMatchObject({
      name: "ConflictError",
      message: "LAST_SUPERADMIN",
    })
  })
})