import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import type { ApiResponse } from "@/types/domain.types"

export async function POST() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const finished = await prisma.challenge.findMany({
      where: { phase: { in: ["RESULT", "FINISHED"] } },
      select: {
        id: true,
        team1TimerDurationSeconds: true,
        team2TimerDurationSeconds: true,
      },
    })

    if (finished.length === 0) {
      return NextResponse.json<ApiResponse<{ count: number }>>({ data: { count: 0 }, error: null })
    }

    await prisma.$transaction(
      finished.flatMap((c) => [
        prisma.publicVote.deleteMany({ where: { challengeId: c.id } }),
        prisma.juryVote.deleteMany({ where: { challengeId: c.id } }),
        prisma.challenge.update({
          where: { id: c.id },
          data: {
            phase: "WAITING",
            status: "PENDING",
            winnerId: null,
            voteOpenAt: null,
            voteCloseAt: null,
            votingStartedAt: null,
            votingEndsAt: null,
            team1FinalScore: null,
            team2FinalScore: null,
            team1PublicPct: null,
            team2PublicPct: null,
            team1JuryPct: null,
            team2JuryPct: null,
            team1TimerRemainingSeconds: c.team1TimerDurationSeconds,
            team1TimerStatus: "READY",
            team1TimerStartedAt: null,
            team1TimerPausedAt: null,
            team2TimerRemainingSeconds: c.team2TimerDurationSeconds,
            team2TimerStatus: "READY",
            team2TimerStartedAt: null,
            team2TimerPausedAt: null,
          },
        }),
      ]),
    )

    return NextResponse.json<ApiResponse<{ count: number }>>({ data: { count: finished.length }, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    console.error("[POST /api/admin/matches/reset-finished]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
