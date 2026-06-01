import { NextResponse } from "next/server"
import { getMatchesForAdmin, deleteAllChallenges } from "@/server/modules/matches/repository"
import { finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"

export const dynamic = "force-dynamic"
export const revalidate = 0
import type { ApiResponse } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function GET() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    // Auto-finalize any expired voting challenges before returning data
    const matches = await getMatchesForAdmin(EVENT_ID)
    
    console.log("[ADMIN_LIVE_STATE_RENDERED_REQUEST]", JSON.stringify({
      eventId: EVENT_ID,
      matchCount: matches.length,
      matches: matches.map(m => ({
        matchId: m.id,
        challengeId: m.id,
        phase: m.phase,
        team1Timer: {
          status: m.team1Timer.status,
          startedAt: m.team1Timer.startedAt,
          remainingSeconds: m.team1Timer.remainingSeconds,
          durationSeconds: m.team1Timer.durationSeconds,
        },
        team2Timer: {
          status: m.team2Timer.status,
          startedAt: m.team2Timer.startedAt,
          remainingSeconds: m.team2Timer.remainingSeconds,
          durationSeconds: m.team2Timer.durationSeconds,
        },
      })),
      serverNow: new Date().toISOString(),
    }))

    await Promise.all(matches.map(m => m.phase === "VOTING" ? finalizeExpiredVotingIfNeeded(m.id) : Promise.resolve()))

    const responseWithHeaders = NextResponse.json<ApiResponse<typeof matches>>({ data: matches, error: null })
    responseWithHeaders.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    responseWithHeaders.headers.set("Pragma", "no-cache")
    responseWithHeaders.headers.set("Expires", "0")
    return responseWithHeaders
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const count = await deleteAllChallenges(EVENT_ID)
    return NextResponse.json<ApiResponse<{ count: number }>>({ data: { count }, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    console.error("[DELETE /api/admin/matches]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
