import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createChallengeSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

// GET /api/challenges?eventId=xxx
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId")
    if (!eventId) return NextResponse.json<ApiResponse<null>>({ data: null, error: "MISSING_EVENT_ID" }, { status: 400 })

    const rows = await prisma.challenge.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
      take: 20,
      select: {
        id: true, name: true, description: true, slug: true, order: true,
        status: true, phase: true, timerSecs: true, timerActive: true,
        voteOpenAt: true, voteCloseAt: true, votingEndsAt: true, votingSessionId: true, winnerId: true,
        teams: { select: { id: true, name: true, idea: true, members: true, slot: true, imageUrl: true } },
        _count: { select: { publicVotes: true, juryVotes: true } },
      },
    })

    const data = rows.map(c => ({
      ...c,
      voteOpenAt:  c.voteOpenAt?.toISOString()  ?? null,
      voteCloseAt: c.voteCloseAt?.toISOString() ?? null,
      votingEndsAt: c.votingEndsAt?.toISOString() ?? null,
      votingSessionId: c.votingSessionId,
      team1: c.teams.find(t => t.slot === "TEAM1") ?? null,
      team2: c.teams.find(t => t.slot === "TEAM2") ?? null,
      publicVoteCount: c._count.publicVotes,
      juryVoteCount:   c._count.juryVotes,
    }))

    return NextResponse.json<ApiResponse<typeof data>>({ data, error: null })
  } catch (err) {
    console.error("[GET /api/challenges]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

// POST /api/challenges — create (admin/superadmin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = createChallengeSchema.safeParse(await req.json())
    if (!body.success) return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const challenge = await prisma.challenge.create({
      data: { ...body.data, description: body.data.description ?? null },
      select: { id: true, name: true, slug: true, order: true, status: true, phase: true },
    })
    return NextResponse.json<ApiResponse<typeof challenge>>({ data: challenge, error: null }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("P2002"))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "SLUG_TAKEN" }, { status: 409 })
    console.error("[POST /api/challenges]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
