import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveMatch, getMatchById } from "@/server/modules/matches/repository"
import { calculateActualRemaining, getTimerStatusDisplay, finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import { computePresentationSnapshot, computeVotingSnapshot, deriveActivePresentationTeam } from "@/lib/timer-snapshot"

export const dynamic = "force-dynamic"
export const revalidate = 0
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

    const team1TimerSnapshot = computePresentationSnapshot({
      status: match.team1Timer.status,
      remainingSeconds: match.team1Timer.remainingSeconds,
      startedAt: match.team1Timer.startedAt,
      pausedAt: match.team1Timer.pausedAt,
      durationSeconds: match.team1Timer.durationSeconds,
    })

    const team2TimerSnapshot = computePresentationSnapshot({
      status: match.team2Timer.status,
      remainingSeconds: match.team2Timer.remainingSeconds,
      startedAt: match.team2Timer.startedAt,
      pausedAt: match.team2Timer.pausedAt,
      durationSeconds: match.team2Timer.durationSeconds,
    })

    const votingTimerSnapshot = computeVotingSnapshot({
      votingTimerStatus: match.votingTimerStatus,
      votingEndsAt: match.votingEndsAt,
      votingTimerPausedAt: match.votingTimerPausedAt,
      votingDurationSeconds: match.votingDurationSeconds,
    })

    const hasScores = match.team1FinalScore !== null || match.team2FinalScore !== null
    const isTie = hasScores && !match.winnerId

    let tieReason: string | null = null
    if (isTie) {
      const allPctZero =
        (match.team1PublicPct ?? 0) === 0 && (match.team2PublicPct ?? 0) === 0 &&
        (match.team1JuryPct ?? 0) === 0 && (match.team2JuryPct ?? 0) === 0
      tieReason = allPctZero ? "NO_VOTES" : "EQUAL_SCORE"
    }

    const activePresentationTeam = deriveActivePresentationTeam(
      team1TimerSnapshot, team2TimerSnapshot, votingTimerSnapshot, match.phase,
    )

    const response = {
      ...match,
      isTie,
      tieReason,
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
      team1TimerSnapshot,
      team2TimerSnapshot,
      votingTimerSnapshot,
      activePresentationTeam,
      serverNow,
    }

    console.log("[LIVE_STATE_TIMER_VALUE]", JSON.stringify({
      eventId: EVENT_ID,
      matchId: match.id,
      team: "TEAM2",
      // Raw DB values
      dbStatus: match.team2Timer.status,
      dbRemainingSeconds: match.team2Timer.remainingSeconds,
      dbDurationSeconds: match.team2Timer.durationSeconds,
      dbStartedAt: match.team2Timer.startedAt,
      // Calculated actual from DB
      calculatedActual: team2Actual,
      // Snapshot computation
      snapshotRemainingSeconds: team2TimerSnapshot.remainingSeconds,
      snapshotStatus: team2TimerSnapshot.status,
      // Formula analysis for RUNNING
      isRunning: match.team2Timer.status === "RUNNING",
      rawElapsedSeconds: match.team2Timer.startedAt ? Math.floor((Date.now() - new Date(match.team2Timer.startedAt).getTime()) / 1000) : null,
      effectiveElapsedSeconds: match.team2Timer.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(match.team2Timer.startedAt).getTime()) / 1000) - 3) : null,
      snapshotFormula: "durationSeconds - effectiveElapsed",
      expectedFromFormula: match.team2Timer.status === "RUNNING" && match.team2Timer.startedAt ? Math.max(0, match.team2Timer.durationSeconds - Math.max(0, Math.floor((Date.now() - new Date(match.team2Timer.startedAt).getTime()) / 1000) - 3)) : null,
      adminFormula: "dbRemainingSeconds - (now - startedAt)",
      expectedFromAdminFormula: match.team2Timer.status === "RUNNING" && match.team2Timer.startedAt ? Math.max(0, match.team2Timer.remainingSeconds - Math.floor((Date.now() - new Date(match.team2Timer.startedAt).getTime()) / 1000)) : null,
      serverNow: new Date().toISOString(),
    }))

    console.log("[DISPLAY_LIVE_STATE_FETCHED]", JSON.stringify({
      eventId: EVENT_ID,
      matchId: match.id,
      challengeId: match.id,
      phase: match.phase,
      activePresentationTeam,
      team1Raw: {
        status: match.team1Timer.status,
        startedAt: match.team1Timer.startedAt,
        remainingSeconds: match.team1Timer.remainingSeconds,
        durationSeconds: match.team1Timer.durationSeconds,
      },
      team1Snapshot: {
        status: team1TimerSnapshot.status,
        remainingSeconds: team1TimerSnapshot.remainingSeconds,
      },
      team2Raw: {
        status: match.team2Timer.status,
        startedAt: match.team2Timer.startedAt,
        remainingSeconds: match.team2Timer.remainingSeconds,
        durationSeconds: match.team2Timer.durationSeconds,
      },
      team2Snapshot: {
        status: team2TimerSnapshot.status,
        remainingSeconds: team2TimerSnapshot.remainingSeconds,
      },
      votingSnapshot: {
        status: votingTimerSnapshot.status,
        remainingSeconds: votingTimerSnapshot.remainingSeconds,
      },
      serverNow,
    }))

    const responseWithHeaders = NextResponse.json<ApiResponse<typeof response>>({ data: response, error: null })
    responseWithHeaders.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    responseWithHeaders.headers.set("Pragma", "no-cache")
    responseWithHeaders.headers.set("Expires", "0")
    return responseWithHeaders
  } catch {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
