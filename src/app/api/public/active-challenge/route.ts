import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import type { ApiResponse } from "@/types/domain.types"

export const dynamic = "force-dynamic"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function GET() {
  try {
    const event = await prisma.event.findUnique({
      where: { id: EVENT_ID },
      select: { activeChallengeId: true },
    })

    let challengeId = event?.activeChallengeId ?? null

    // Fallback: find challenge currently in VOTING phase
    if (!challengeId) {
      const votingChallenge = await prisma.challenge.findFirst({
        where: { eventId: EVENT_ID, phase: "VOTING" },
        select: { id: true },
      })
      challengeId = votingChallenge?.id ?? null
    }

    if (!challengeId) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "NO_ACTIVE_CHALLENGE" }, { status: 404 })
    }

    // Auto-finalize expired voting before returning data
    await finalizeExpiredVotingIfNeeded(challengeId)

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        name: true,
        phase: true,
        votingEndsAt: true,
        voteCloseAt: true,
        votingStartedAt: true,
        votingSessionId: true,
        votingTimerStatus: true,
        votingTimerPausedAt: true,
        votingDurationSeconds: true,
        teams: { select: { id: true, name: true, slot: true, imageUrl: true } },
      },
    })

    if (!challenge) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "CHALLENGE_NOT_FOUND" }, { status: 404 })
    }

    const team1 = challenge.teams.find((t) => t.slot === "TEAM1")
    const team2 = challenge.teams.find((t) => t.slot === "TEAM2")

    const response = {
      id: challenge.id,
      title: challenge.name,
      phase: challenge.phase,
      votingEndsAt: challenge.votingEndsAt?.toISOString() ?? null,
      votingStartedAt: challenge.votingStartedAt?.toISOString() ?? null,
      votingSessionId: challenge.votingSessionId,
      votingTimerStatus: challenge.votingTimerStatus,
      votingTimerPausedAt: challenge.votingTimerPausedAt?.toISOString() ?? null,
      votingDurationSeconds: challenge.votingDurationSeconds,
      voteClosed: !!challenge.voteCloseAt,
      team1: team1 ? { id: team1.id, name: team1.name, imageUrl: team1.imageUrl } : null,
      team2: team2 ? { id: team2.id, name: team2.name, imageUrl: team2.imageUrl } : null,
    }

    return NextResponse.json<ApiResponse<typeof response>>({ data: response, error: null })
  } catch {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
