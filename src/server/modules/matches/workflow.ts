import type { ChallengePhase } from "@/types/domain.types"

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkflowError"
  }
}

const ALLOWED_TRANSITIONS: Record<ChallengePhase, ChallengePhase[]> = {
  WAITING:     ["PRESENTING"],
  PRESENTING:  ["VOTING"],
  VOTING:      ["RESULT"],
  RESULT:      ["FINISHED"],
  FINISHED:    [],
}

export function assertValidPhaseTransition(
  current: ChallengePhase,
  next: ChallengePhase,
): void {
  if (current === next) return
  const allowed = ALLOWED_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    throw new WorkflowError(
      `Invalid transition: ${current} -> ${next}. Allowed: ${allowed.join(", ")}`,
    )
  }
}

export function assertCanStartVoting(
  phase: ChallengePhase,
  team1TimerStatus: string,
  team2TimerStatus: string,
): void {
  if (phase !== "PRESENTING") {
    throw new WorkflowError("Can only start voting from PRESENTING phase")
  }
  const t1Done = team1TimerStatus === "FINISHED"
  const t2Done = team2TimerStatus === "FINISHED"
  if (!t1Done || !t2Done) {
    throw new WorkflowError("Both teams must finish presenting before voting starts")
  }
}

export function assertCanFinalizeResult(
  phase: ChallengePhase,
  votingTimerStatus?: string,
  votingEndsAt?: string | null,
): void {
  console.log("[FINALIZE_RESULT_GUARD_CHECK]", JSON.stringify({
    phase,
    votingTimerStatus: votingTimerStatus ?? null,
    votingEndsAt: votingEndsAt ?? null,
    now: new Date().toISOString(),
  }))

  // Allow idempotent re-reveal if already in RESULT
  if (phase === "RESULT") {
    console.log("[FINALIZE_RESULT_ALLOWED]", JSON.stringify({ phase, reason: "already in RESULT" }))
    return
  }

  // Must be in VOTING phase
  if (phase !== "VOTING") {
    console.log("[FINALIZE_RESULT_BLOCKED]", JSON.stringify({ phase, reason: "not VOTING" }))
    throw new WorkflowError("Can only finalize result after voting ends")
  }

  // Allow if voting timer is explicitly finished or paused
  if (votingTimerStatus === "FINISHED" || votingTimerStatus === "PAUSED") {
    console.log("[FINALIZE_RESULT_ALLOWED]", JSON.stringify({ phase, votingTimerStatus, reason: "voting ended or paused" }))
    return
  }

  // Allow if votingEndsAt has passed (natural expiry with 5s grace)
  if (votingEndsAt && Date.now() >= new Date(votingEndsAt).getTime() - 5000) {
    console.log("[FINALIZE_RESULT_ALLOWED]", JSON.stringify({ phase, votingEndsAt, reason: "voting naturally expired" }))
    return
  }

  // Voting timer is still RUNNING or not started
  console.log("[FINALIZE_RESULT_BLOCKED]", JSON.stringify({ phase, votingTimerStatus, reason: "voting still open or not started" }))
  throw new WorkflowError("Can only finalize result after voting ends")
}

export function assertVotingIsClosed(votingEndsAt: string | null, votingTimerStatus?: string): void {
  // If voting timer is paused or finished, treat as closed
  if (votingTimerStatus === "PAUSED" || votingTimerStatus === "FINISHED") return
  if (!votingEndsAt) {
    throw new WorkflowError("Voting has not been started")
  }
  const now = Date.now()
  const end = new Date(votingEndsAt).getTime()
  // 5-second grace period for clock skew between client and server
  if (now < end - 5000) {
    throw new WorkflowError("VOTING_STILL_OPEN")
  }
}

export function assertNoOtherActiveChallenge(otherActiveId: string | null): void {
  if (otherActiveId) {
    throw new WorkflowError(
      `Another challenge is already active. Finish or reset it first.`,
    )
  }
}

export function assertChallengeCanBeActivated(
  phase: ChallengePhase,
): void {
  if (phase === "FINISHED" || phase === "RESULT") {
    throw new WorkflowError("انتهى التحدي أو في مرحلة النتيجة. أعد الضبط أولاً.")
  }
}
