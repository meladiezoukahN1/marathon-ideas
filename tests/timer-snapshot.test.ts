import { computePresentationSnapshot, computeVotingSnapshot, computeEffectiveElapsed, deriveActivePresentationTeam } from "@/lib/timer-snapshot"
import type { TimerSnapshot } from "@/lib/timer-snapshot"

function idle(): TimerSnapshot {
  return { status: "IDLE", durationSeconds: 20, remainingSeconds: 20, startsAt: null, startedAt: null, pausedAt: null, serverNow: new Date().toISOString() }
}
function running(): TimerSnapshot {
  return { status: "RUNNING", durationSeconds: 20, remainingSeconds: 15, startsAt: null, startedAt: new Date().toISOString(), pausedAt: null, serverNow: new Date().toISOString() }
}
function ended(): TimerSnapshot {
  return { status: "ENDED", durationSeconds: 20, remainingSeconds: 0, startsAt: null, startedAt: null, pausedAt: null, serverNow: new Date().toISOString() }
}
function paused(): TimerSnapshot {
  return { status: "PAUSED", durationSeconds: 20, remainingSeconds: 10, startsAt: null, startedAt: null, pausedAt: new Date().toISOString(), serverNow: new Date().toISOString() }
}
function scheduled(): TimerSnapshot {
  return { status: "SCHEDULED", durationSeconds: 20, remainingSeconds: 20, startsAt: new Date(Date.now() + 3000).toISOString(), startedAt: new Date().toISOString(), pausedAt: null, serverNow: new Date().toISOString() }
}
function votingRunning(): TimerSnapshot {
  return { status: "RUNNING", durationSeconds: 120, remainingSeconds: 60, startsAt: null, startedAt: null, pausedAt: null, serverNow: new Date().toISOString() }
}

describe("computePresentationSnapshot", () => {
  it("starting a 20-second timer returns SCHEDULED with startsAt about 3 seconds in the future", () => {
    const now = Date.now()
    const startedAt = new Date(now).toISOString()
    const result = computePresentationSnapshot({
      status: "RUNNING",
      remainingSeconds: 20,
      startedAt,
      pausedAt: null,
      durationSeconds: 20,
    }, now)

    expect(result.status).toBe("SCHEDULED")
    expect(result.remainingSeconds).toBe(20)
    expect(result.startsAt).not.toBeNull()
    const startsAtMs = new Date(result.startsAt!).getTime()
    expect(startsAtMs - now).toBeCloseTo(3000, -2)
  })

  it("before startsAt, remainingSeconds is full duration", () => {
    const now = Date.now()
    const startedAt = new Date(now).toISOString()
    const result = computePresentationSnapshot({
      status: "RUNNING",
      remainingSeconds: 20,
      startedAt,
      pausedAt: null,
      durationSeconds: 20,
    }, now)

    expect(result.status).toBe("SCHEDULED")
    expect(result.remainingSeconds).toBe(20)
  })

  it("after startsAt + 1 second, remainingSeconds is 19", () => {
    const startedAt = new Date(Date.now() - 4000).toISOString()
    const result = computePresentationSnapshot({
      status: "RUNNING",
      remainingSeconds: 20,
      startedAt,
      pausedAt: null,
      durationSeconds: 20,
    })

    expect(result.status).toBe("RUNNING")
    expect(result.remainingSeconds).toBe(19)
  })

  it("pause preserves remaining time", () => {
    const result = computePresentationSnapshot({
      status: "PAUSED",
      remainingSeconds: 14,
      startedAt: null,
      pausedAt: new Date().toISOString(),
      durationSeconds: 20,
    })

    expect(result.status).toBe("PAUSED")
    expect(result.remainingSeconds).toBe(14)
  })

  it("resume preserves remaining time", () => {
    // After fix: remaining is calculated from stored remainingSeconds, not durationSeconds
    // This ensures patched/paused timers maintain their modified remaining time
    const startedAt = new Date(Date.now() - 5000).toISOString()
    const result = computePresentationSnapshot({
      status: "RUNNING",
      remainingSeconds: 14,
      startedAt,
      pausedAt: null,
      durationSeconds: 20,
    })

    expect(result.status).toBe("RUNNING")
    // With fix: remainingSeconds - effectiveElapsed = 14 - (5 - 3) = 12
    expect(result.remainingSeconds).toBe(12)
  })

  it("reset clears old state to IDLE", () => {
    const result = computePresentationSnapshot({
      status: "READY",
      remainingSeconds: 20,
      startedAt: null,
      pausedAt: null,
      durationSeconds: 20,
    })

    expect(result.status).toBe("IDLE")
    expect(result.remainingSeconds).toBe(20)
  })

  it("ended status remains ENDED", () => {
    const result = computePresentationSnapshot({
      status: "FINISHED",
      remainingSeconds: 0,
      startedAt: null,
      pausedAt: null,
      durationSeconds: 20,
    })

    expect(result.status).toBe("ENDED")
    expect(result.remainingSeconds).toBe(0)
  })
})

describe("computeVotingSnapshot", () => {
  it("RUNNING with future end shows countdown", () => {
    const endsAt = new Date(Date.now() + 10000).toISOString()
    const result = computeVotingSnapshot({
      votingTimerStatus: "RUNNING",
      votingEndsAt: endsAt,
      votingTimerPausedAt: null,
      votingDurationSeconds: 120,
    })

    expect(result.status).toBe("RUNNING")
    expect(result.remainingSeconds).toBeGreaterThan(0)
    expect(result.remainingSeconds).toBeLessThanOrEqual(10)
  })

  it("PAUSED preserves remaining", () => {
    const result = computeVotingSnapshot({
      votingTimerStatus: "PAUSED",
      votingEndsAt: new Date(Date.now() + 45000).toISOString(),
      votingTimerPausedAt: new Date().toISOString(),
      votingDurationSeconds: 120,
    })

    expect(result.status).toBe("PAUSED")
  })

  it("IDLE returns full duration", () => {
    const result = computeVotingSnapshot({
      votingTimerStatus: "READY",
      votingEndsAt: null,
      votingTimerPausedAt: null,
      votingDurationSeconds: 120,
    })

    expect(result.status).toBe("IDLE")
    expect(result.remainingSeconds).toBe(120)
  })
})

describe("computeEffectiveElapsed", () => {
  it("returns 0 when within the 3-second grace period", () => {
    const startedAt = new Date(Date.now() - 1000).toISOString()
    expect(computeEffectiveElapsed(startedAt)).toBe(0)
  })

  it("returns elapsed minus 3 seconds after grace period", () => {
    const startedAt = new Date(Date.now() - 10000).toISOString()
    const effective = computeEffectiveElapsed(startedAt)
    expect(effective).toBe(7)
  })
})

describe("deriveActivePresentationTeam", () => {
  it("when team1 ENDED and team2 RUNNING, returns TEAM2", () => {
    expect(deriveActivePresentationTeam(ended(), running(), idle(), "PRESENTING")).toBe("TEAM2")
  })

  it("when team1 RUNNING and team2 IDLE, returns TEAM1", () => {
    expect(deriveActivePresentationTeam(running(), idle(), idle(), "PRESENTING")).toBe("TEAM1")
  })

  it("when team1 SCHEDULED and team2 PAUSED, returns TEAM1 (first active wins)", () => {
    expect(deriveActivePresentationTeam(scheduled(), paused(), idle(), "PRESENTING")).toBe("TEAM1")
  })

  it("when both presentation timers ENDED and voting RUNNING, returns VOTING", () => {
    expect(deriveActivePresentationTeam(ended(), ended(), votingRunning(), "VOTING")).toBe("VOTING")
  })

  it("when both presentation timers ENDED and voting PAUSED, returns VOTING", () => {
    expect(deriveActivePresentationTeam(ended(), ended(), paused(), "VOTING")).toBe("VOTING")
  })

  it("when both presentation timers ENDED and voting IDLE, returns WAITING", () => {
    expect(deriveActivePresentationTeam(ended(), ended(), idle(), "PRESENTING")).toBe("WAITING")
  })

  it("when phase RESULT and all idle, returns RESULT", () => {
    expect(deriveActivePresentationTeam(ended(), ended(), idle(), "RESULT")).toBe("RESULT")
  })

  it("voting timer snapshot RUNNING overrides WAITING phase", () => {
    expect(deriveActivePresentationTeam(ended(), ended(), votingRunning(), "PRESENTING")).toBe("VOTING")
  })
})
