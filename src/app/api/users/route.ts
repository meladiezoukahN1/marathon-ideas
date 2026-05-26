import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validators"
import bcrypt from "bcryptjs"
import type { ApiResponse } from "@/types/domain.types"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPERADMIN")
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const eventId = req.nextUrl.searchParams.get("eventId")
    if (!eventId)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "MISSING_EVENT_ID" }, { status: 400 })

    const users = await prisma.user.findMany({
      where: { eventId },
      orderBy: [{ role: "asc" }, { username: "asc" }],
      take: 100,
      select: { id: true, username: true, role: true, createdAt: true },
    })
    const data = users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))
    return NextResponse.json<ApiResponse<typeof data>>({ data, error: null })
  } catch (err) {
    console.error("[GET /api/users]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPERADMIN")
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = createUserSchema.safeParse(await req.json())
    if (!body.success)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const hash = await bcrypt.hash(body.data.password, 12)
    const user = await prisma.user.create({
      data: { ...body.data, password: hash },
      select: { id: true, username: true, role: true, createdAt: true },
    })
    return NextResponse.json<ApiResponse<{ id: string; username: string; role: string; createdAt: string }>>({
      data: { ...user, createdAt: user.createdAt.toISOString() }, error: null,
    }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("P2002"))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "USERNAME_TAKEN" }, { status: 409 })
    console.error("[POST /api/users]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPERADMIN")
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "MISSING_USER_ID" }, { status: 400 })

    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err) {
    console.error("[DELETE /api/users]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
