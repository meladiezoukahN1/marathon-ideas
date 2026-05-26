import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveMatch, getMatchById } from "@/server/modules/matches/repository"
import { calculateActualRemaining, getTimerStatusDisplay, finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"

export const dynamic = "force-dynamic"
import type { ApiResponse } from "@/types/domain.types"
import type { TimerStatus } from "@/server/modules/matches/types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function GET() {
  try {
    let match = await getActiveMatch(EVENT_ID)

    // Fallback: find any challenge in active phases
    if (!match) {
      const active = await prisma.challenge.findFirst({
        where: {
          eventId: EVENT_ID,
          phase: { in: ["PRESENTING", "VOTING", "RESULT"] },
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      })
      if (active) {
        match = await getMatchById(active.id)
      }
    }

    if (!match) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "NO_ACTIVE_MATCH" }, { status: 404 })
    }

    // Auto-finalize expired voting before returning data
    const finalized = await finalizeExpiredVotingIfNeeded(match.id)
    if (finalized) match = finalized

    const serverNow = new Date().toISOString()

    const team1Actual = calculateActualRemaining(match.team1Timer.remainingSeconds, match.team1Timer.startedAt)
    const team2Actual = calculateActualRemaining(match.team2Timer.remainingSeconds, match.team2Timer.startedAt)

    const team1Status = getTimerStatusDisplay(match.team1Timer.status as TimerStatus, team1Actual)
    const team2Status = getTimerStatusDisplay(match.team2Timer.status as TimerStatus, team2Actual)

    const response = {
      ...match,
      team1Timer: {
        ...match.team1Timer,
        remainingSeconds: team1Actual,
        status: team1Status,
      },
      team2Timer: {
        ...match.team2Timer,
        remainingSeconds: team2Actual,
        status: team2Status,
      },
      serverNow,
    }

    return NextResponse.json<ApiResponse<typeof response>>({ data: response, error: null })
  } catch {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
