import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateTeamSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = updateTeamSchema.safeParse(await req.json())
    if (!body.success) return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const updateData: Record<string, unknown> = { ...body.data }
    if (updateData.imageUrl === "") {
      updateData.imageUrl = null
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, idea: true, members: true, slot: true, imageUrl: true },
    })
    return NextResponse.json<ApiResponse<typeof team>>({ data: team, error: null })
  } catch (err) {
    console.error("[PATCH /api/teams/:id]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    await prisma.team.delete({ where: { id: params.id } })
    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err) {
    console.error("[DELETE /api/teams/:id]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
