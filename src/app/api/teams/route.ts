import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTeamSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

// POST /api/teams
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = createTeamSchema.safeParse(await req.json())
    if (!body.success) return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const team = await prisma.team.create({
      data: { ...body.data, members: body.data.members ?? null, imageUrl: body.data.imageUrl ?? null },
      select: { id: true, name: true, idea: true, slot: true, challengeId: true, imageUrl: true },
    })
    return NextResponse.json<ApiResponse<typeof team>>({ data: team, error: null }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("P2002"))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "SLOT_TAKEN" }, { status: 409 })
    console.error("[POST /api/teams]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
