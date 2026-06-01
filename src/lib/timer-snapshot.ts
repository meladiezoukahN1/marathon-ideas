const SCHEDULED_DELAY_SECONDS = 3

export interface TimerSnapshot {
  status: "IDLE" | "SCHEDULED" | "RUNNING" | "PAUSED" | "ENDED"
  durationSeconds: number
  remainingSeconds: number
  startsAt: string | null
  startedAt: string | null
  pausedAt: string | null
  serverNow: string
}

export interface PresentationTimerInput {
  status: string
  remainingSeconds: number
  startedAt: string | null
  pausedAt: string | null
  durationSeconds: number
}

export interface VotingTimerInput {
  votingTimerStatus: string
  votingEndsAt: string | null
  votingTimerPausedAt: string | null
  votingDurationSeconds: number
}

function statusFromDB(s: string): "IDLE" | "RUNNING" | "PAUSED" | "ENDED" {
  if (s === "READY" || s === "IDLE") return "IDLE"
  if (s === "FINISHED" || s === "ENDED") return "ENDED"
  if (s === "RUNNING") return "RUNNING"
  if (s === "PAUSED") return "PAUSED"
  return "IDLE"
}

function computeElapsedSeconds(startedAt: string | null, now: number = Date.now()): number {
  if (!startedAt) return 0
  return Math.floor((now - new Date(startedAt).getTime()) / 1000)
}

export function computePresentationSnapshot(
  timer: PresentationTimerInput,
  now: number = Date.now(),
): TimerSnapshot {
  const rawStatus = statusFromDB(timer.status)
  const started = timer.startedAt

  let status: TimerSnapshot["status"] = rawStatus
  let remainingSeconds = timer.remainingSeconds

  if (rawStatus === "RUNNING" && started) {
    const rawElapsed = computeElapsedSeconds(started, now)
    if (rawElapsed < SCHEDULED_DELAY_SECONDS) {
      status = "SCHEDULED"
      remainingSeconds = timer.durationSeconds
    } else {
      // ✅ FIX: Calculate remaining from stored value, not from duration
      // This ensures patched timers maintain their modified remaining time
      const effectiveElapsed = rawElapsed - SCHEDULED_DELAY_SECONDS
      remainingSeconds = Math.max(0, timer.remainingSeconds - effectiveElapsed)
      if (remainingSeconds <= 0) {
        status = "ENDED"
        remainingSeconds = 0
      }
    }
  }

  if (status === "SCHEDULED" && started) {
    const startsAt = new Date(new Date(started).getTime() + SCHEDULED_DELAY_SECONDS * 1000)
    return {
      status,
      durationSeconds: timer.durationSeconds,
      remainingSeconds: timer.durationSeconds,
      startsAt: startsAt.toISOString(),
      startedAt: started,
      pausedAt: null,
      serverNow: new Date(now).toISOString(),
    }
  }

  const startsAt = null

  if (status === "PAUSED") {
    remainingSeconds = timer.remainingSeconds
  }

  return {
    status,
    durationSeconds: timer.durationSeconds,
    remainingSeconds,
    startsAt,
    startedAt: started,
    pausedAt: timer.pausedAt,
    serverNow: new Date(now).toISOString(),
  }
}

export function computeVotingSnapshot(
  voting: VotingTimerInput,
  now: number = Date.now(),
): TimerSnapshot {
  const rawStatus = statusFromDB(voting.votingTimerStatus)
  const votingEndsAt = voting.votingEndsAt

  let status = rawStatus
  let remainingSeconds = 0

  if (rawStatus === "RUNNING" && votingEndsAt) {
    const endTime = new Date(votingEndsAt).getTime()
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000))
    if (timeLeft <= 0) {
      status = "ENDED"
      remainingSeconds = 0
    } else {
      remainingSeconds = timeLeft
    }
  } else if (rawStatus === "PAUSED" && votingEndsAt) {
    remainingSeconds = Math.max(0, Math.floor((new Date(votingEndsAt).getTime() - now) / 1000))
  } else if (rawStatus === "IDLE") {
    remainingSeconds = voting.votingDurationSeconds
  }

  return {
    status,
    durationSeconds: voting.votingDurationSeconds,
    remainingSeconds,
    startsAt: null,
    startedAt: null,
    pausedAt: voting.votingTimerPausedAt,
    serverNow: new Date(now).toISOString(),
  }
}

export function computeEffectiveElapsed(startedAt: string | null): number {
  if (!startedAt) return 0
  const elapsed = computeElapsedSeconds(startedAt)
  return Math.max(0, elapsed - SCHEDULED_DELAY_SECONDS)
}

export type ActivePresentationTeam = "TEAM1" | "TEAM2" | "VOTING" | "WAITING" | "RESULT"

function isSnapshotActive(snap: TimerSnapshot): boolean {
  return snap.status === "SCHEDULED" || snap.status === "RUNNING" || snap.status === "PAUSED"
}

export function deriveActivePresentationTeam(
  team1Snapshot: TimerSnapshot,
  team2Snapshot: TimerSnapshot,
  votingSnapshot: TimerSnapshot,
  phase: string,
): ActivePresentationTeam {
  if (isSnapshotActive(team1Snapshot)) return "TEAM1"
  if (isSnapshotActive(team2Snapshot)) return "TEAM2"
  if (isSnapshotActive(votingSnapshot)) return "VOTING"

  if (phase === "RESULT" || phase === "FINISHED") return "RESULT"
  return "WAITING"
}
