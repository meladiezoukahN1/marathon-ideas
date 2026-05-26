import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateChallengeSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

// PATCH /api/challenges/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = updateChallengeSchema.safeParse(await req.json())
    if (!body.success) return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const updated = await prisma.challenge.update({
      where: { id: params.id },
      data: body.data,
      select: { id: true, name: true, description: true },
    })
    return NextResponse.json<ApiResponse<typeof updated>>({ data: updated, error: null })
  } catch (err) {
    console.error("[PATCH /api/challenges/:id]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

// DELETE /api/challenges/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: {
        _count: { select: { teams: true, publicVotes: true, juryVotes: true } },
        phase: true,
      },
    })

    if (!challenge) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "CHALLENGE_NOT_FOUND" }, { status: 404 })
    }

    // Safety: block deletion if challenge has data that would be lost
    if (challenge._count.teams > 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: "CHALLENGE_HAS_TEAMS: قم بحذف الفرق أولاً أو استخدم إعادة الضبط",
      }, { status: 409 })
    }

    if (challenge._count.publicVotes > 0 || challenge._count.juryVotes > 0) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: "CHALLENGE_HAS_VOTES: قم بإعادة ضبط التحدي أولاً قبل الحذف",
      }, { status: 409 })
    }

    await prisma.challenge.delete({ where: { id: params.id } })
    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err) {
    console.error("[DELETE /api/challenges/:id]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
