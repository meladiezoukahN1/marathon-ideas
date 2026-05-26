import {
  getMatchById,
  updateTimerState,
  resetTimerState,
  setActiveMatch,
  updateChallengePhase,
  getVoteCounts,
  storeResult,
  resetMatch as resetMatchRepo,
  getOtherActiveChallenge,
  deleteAllChallenges,
  resetAllChallenges,
} from "./repository"
import {
  assertValidPhaseTransition,
  assertCanStartVoting,
  assertCanFinalizeResult,
  assertVotingIsClosed,
  assertNoOtherActiveChallenge,
  assertChallengeCanBeActivated,
} from "./workflow"
import crypto from "crypto"
import type { TimerStatus, TeamSlot, TimerPayload } from "./types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

function secondsBetween(start: Date | string | null, end: Date | string | null): number {
  if (!start || !end) return 0
  const s = typeof start === "string" ? new Date(start) : start
  const e = typeof end === "string" ? new Date(end) : end
  return Math.floor((e.getTime() - s.getTime()) / 1000)
}

export function calculateActualRemaining(
  remainingSeconds: number,
  startedAt: string | Date | null,
): number {
  if (!startedAt) return remainingSeconds
  const elapsed = secondsBetween(startedAt, new Date())
  return Math.max(0, remainingSeconds - elapsed)
}

export function getTimerStatusDisplay(
  status: TimerStatus,
  actualRemaining: number,
): TimerStatus {
  if (status === "RUNNING" && actualRemaining <= 0) return "FINISHED"
  return status
}

export async function startTimer(matchId: string, slot: TeamSlot) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")

  const timer = slot === "TEAM1" ? match.team1Timer : match.team2Timer
  if (timer.status === "FINISHED") {
    throw new Error("TIMER_FINISHED_MUST_RESET")
  }
  if (timer.status === "RUNNING") {
    return { timer: { ...timer, status: "RUNNING" as TimerStatus } }
  }

  await updateTimerState(matchId, slot, {
    status: "RUNNING",
    startedAt: new Date(),
    pausedAt: null,
  })

  const updated = await getMatchById(matchId)
  if (!updated) throw new Error("MATCH_NOT_FOUND")
  return { timer: slot === "TEAM1" ? updated.team1Timer : updated.team2Timer }
}

export async function pauseTimer(matchId: string, slot: TeamSlot) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")

  const timer = slot === "TEAM1" ? match.team1Timer : match.team2Timer
  if (timer.status !== "RUNNING") {
    return { timer }
  }

  const actualRemaining = calculateActualRemaining(
    timer.remainingSeconds,
    timer.startedAt,
  )

  await updateTimerState(matchId, slot, {
    remainingSeconds: actualRemaining,
    status: actualRemaining <= 0 ? "FINISHED" : "PAUSED",
    startedAt: null,
    pausedAt: new Date(),
  })

  const updated = await getMatchById(matchId)
  if (!updated) throw new Error("MATCH_NOT_FOUND")
  return { timer: slot === "TEAM1" ? updated.team1Timer : updated.team2Timer }
}

export async function resetTimer(matchId: string, slot: TeamSlot) {
  await resetTimerState(matchId, slot)
  const updated = await getMatchById(matchId)
  if (!updated) throw new Error("MATCH_NOT_FOUND")
  return { timer: slot === "TEAM1" ? updated.team1Timer : updated.team2Timer }
}

export async function patchTimer(matchId: string, slot: TeamSlot, payload: TimerPayload) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")

  const timer = slot === "TEAM1" ? match.team1Timer : match.team2Timer

  let newRemaining = timer.remainingSeconds

  if (payload.remainingSeconds !== undefined) {
    newRemaining = Math.max(0, payload.remainingSeconds)
  }

  if (payload.deltaSeconds !== undefined) {
    newRemaining = Math.max(0, newRemaining + payload.deltaSeconds)
  }

  const isRunning = timer.status === "RUNNING"
  const startedAt: Date | null = timer.startedAt ? new Date(timer.startedAt) : null

  if (isRunning) {
    const actualRemaining = calculateActualRemaining(timer.remainingSeconds, timer.startedAt)
    if (actualRemaining <= 0) {
      await updateTimerState(matchId, slot, {
        remainingSeconds: 0,
        status: "FINISHED",
        startedAt: null,
        pausedAt: new Date(),
      })
      const updated = await getMatchById(matchId)
      if (!updated) throw new Error("MATCH_NOT_FOUND")
      return { timer: slot === "TEAM1" ? updated.team1Timer : updated.team2Timer }
    }
  }

  await updateTimerState(matchId, slot, {
    remainingSeconds: newRemaining,
    startedAt,
  })

  const updated = await getMatchById(matchId)
  if (!updated) throw new Error("MATCH_NOT_FOUND")
  return { timer: slot === "TEAM1" ? updated.team1Timer : updated.team2Timer }
}

export async function activateMatch(eventId: string, matchId: string) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")

  assertChallengeCanBeActivated(match.phase as "WAITING" | "PRESENTING" | "VOTING" | "RESULT" | "FINISHED")

  const otherActive = await getOtherActiveChallenge(eventId, matchId)
  assertNoOtherActiveChallenge(otherActive)

  await setActiveMatch(eventId, matchId)
  return { match }
}

export async function changePhase(matchId: string, nextPhase: string, votingDurationSeconds?: number) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")

  const currentPhase = match.phase as "WAITING" | "PRESENTING" | "VOTING" | "RESULT" | "FINISHED"
  assertValidPhaseTransition(currentPhase, nextPhase as "WAITING" | "PRESENTING" | "VOTING" | "RESULT" | "FINISHED")

  const extra: Record<string, unknown> = {}
  if (nextPhase === "VOTING") {
    const t1Actual = calculateActualRemaining(match.team1Timer.remainingSeconds, match.team1Timer.startedAt)
    const t2Actual = calculateActualRemaining(match.team2Timer.remainingSeconds, match.team2Timer.startedAt)
    const t1Status = getTimerStatusDisplay(match.team1Timer.status as TimerStatus, t1Actual)
    const t2Status = getTimerStatusDisplay(match.team2Timer.status as TimerStatus, t2Actual)
    assertCanStartVoting(
      currentPhase,
      t1Status,
      t2Status,
    )
    const otherActive = await getOtherActiveChallenge(EVENT_ID, matchId)
    assertNoOtherActiveChallenge(otherActive)
    const duration = votingDurationSeconds ?? match.votingDurationSeconds ?? 120
    const now = new Date()
    const endsAt = new Date(now.getTime() + duration * 1000)
    extra.voteOpenAt = now
    extra.votingStartedAt = now
    extra.votingEndsAt = endsAt
    extra.votingDurationSeconds = duration
    extra.votingSessionId = crypto.randomUUID()
    extra.status = "ACTIVE"
  }
  if (nextPhase === "RESULT") {
    assertCanFinalizeResult(currentPhase)
    extra.voteCloseAt = new Date()
    // Keep status ACTIVE — RESULT still blocks other challenges
  }
  if (nextPhase === "FINISHED") {
    await setActiveMatch(EVENT_ID, null)
    extra.status = "COMPLETED"
  }
  if (nextPhase === "PRESENTING") {
    const otherActive = await getOtherActiveChallenge(EVENT_ID, matchId)
    assertNoOtherActiveChallenge(otherActive)
    extra.status = "ACTIVE"
    await setActiveMatch(EVENT_ID, matchId)
  }

  await updateChallengePhase(matchId, nextPhase, extra)
  return { phase: nextPhase }
}

export async function calculateAndStoreResult(matchId: string) {
  const match = await getMatchById(matchId)
  if (!match) throw new Error("MATCH_NOT_FOUND")
  if (match.phase !== "VOTING" && match.phase !== "RESULT") {
    throw new Error("RESULT_NOT_READY")
  }

  // Idempotent: if already calculated, return existing result
  if (match.phase === "RESULT" && match.winnerId !== undefined) {
    return {
      winnerId: match.winnerId,
      team1FinalScore: match.team1FinalScore ?? 0,
      team2FinalScore: match.team2FinalScore ?? 0,
      team1PublicPct: match.team1PublicPct ?? 0,
      team2PublicPct: match.team2PublicPct ?? 0,
      team1JuryPct: match.team1JuryPct ?? 0,
      team2JuryPct: match.team2JuryPct ?? 0,
    }
  }

  assertVotingIsClosed(match.votingEndsAt)

  const counts = await getVoteCounts(matchId)
  const t1 = match.team1
  const t2 = match.team2
  if (!t1 || !t2) throw new Error("MATCH_NEEDS_TWO_TEAMS")

  const totalPublic = counts.totalPublic
  const totalJury = counts.totalJury

  let team1PublicPct = 0
  let team2PublicPct = 0
  let team1JuryPct = 0
  let team2JuryPct = 0
  let team1FinalScore = 0
  let team2FinalScore = 0

  if (totalPublic > 0) {
    team1PublicPct = (counts.team1Public / totalPublic) * 100
    team2PublicPct = (counts.team2Public / totalPublic) * 100
  }

  if (totalJury > 0) {
    team1JuryPct = (counts.team1Jury / totalJury) * 100
    team2JuryPct = (counts.team2Jury / totalJury) * 100
  }

  // Weighted: public 40%, jury 60%
  if (totalPublic > 0 && totalJury > 0) {
    team1FinalScore = team1PublicPct * 0.4 + team1JuryPct * 0.6
    team2FinalScore = team2PublicPct * 0.4 + team2JuryPct * 0.6
  } else if (totalPublic > 0) {
    team1FinalScore = team1PublicPct
    team2FinalScore = team2PublicPct
  } else if (totalJury > 0) {
    team1FinalScore = team1JuryPct
    team2FinalScore = team2JuryPct
  } else {
    // No votes at all — equal
    team1FinalScore = 50
    team2FinalScore = 50
  }

  // Round to 1 decimal
  team1FinalScore = Math.round(team1FinalScore * 10) / 10
  team2FinalScore = Math.round(team2FinalScore * 10) / 10

  const winnerId = team1FinalScore > team2FinalScore ? t1.id : team2FinalScore > team1FinalScore ? t2.id : null

  await storeResult(matchId, {
    winnerId,
    team1FinalScore,
    team2FinalScore,
    team1PublicPct: Math.round(team1PublicPct * 10) / 10,
    team2PublicPct: Math.round(team2PublicPct * 10) / 10,
    team1JuryPct: Math.round(team1JuryPct * 10) / 10,
    team2JuryPct: Math.round(team2JuryPct * 10) / 10,
  })

  return {
    winnerId,
    team1FinalScore,
    team2FinalScore,
    team1PublicPct,
    team2PublicPct,
    team1JuryPct,
    team2JuryPct,
  }
}

export async function getMatchVoteCounts(matchId: string) {
  const counts = await getVoteCounts(matchId)
  return counts
}

export async function finalizeExpiredVotingIfNeeded(matchId: string) {
  const match = await getMatchById(matchId)
  if (!match) return null
  if (match.phase !== "VOTING") return match
  if (!match.votingEndsAt) return match

  const now = Date.now()
  const end = new Date(match.votingEndsAt).getTime()
  if (now < end - 5000) return match

  const alreadyCalculated =
    match.team1FinalScore !== null ||
    match.team2FinalScore !== null

  if (alreadyCalculated) return match

  try {
    await calculateAndStoreResult(matchId)
    return await getMatchById(matchId)
  } catch {
    return match
  }
}

export async function resetMatch(matchId: string) {
  await resetMatchRepo(matchId)
}

export async function deleteAllMatches(eventId: string) {
  return deleteAllChallenges(eventId)
}

export async function resetAllMatches(eventId: string) {
  return resetAllChallenges(eventId)
}
