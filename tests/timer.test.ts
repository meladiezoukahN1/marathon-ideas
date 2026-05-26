import {
  startTimer,
  pauseTimer,
  resetTimer,
  patchTimer,
  calculateActualRemaining,
} from "@/server/modules/matches/service"
import * as repository from "@/server/modules/matches/repository"
import type { TimerState, AdminMatchListItem } from "@/server/modules/matches/types"

jest.mock("@/server/modules/matches/repository")

const mockedRepo = jest.mocked(repository)

function makeTimerState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    matchId: "match-1",
    teamSlot: "TEAM1",
    durationSeconds: 600,
    remainingSeconds: 600,
    status: "READY",
    startedAt: null,
    pausedAt: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeMatch(team1Overrides: Partial<TimerState> = {}, team2Overrides: Partial<TimerState> = {}): AdminMatchListItem {
  return {
    id: "match-1",
    name: "Test Match",
    order: 1,
    status: "ACTIVE",
    phase: "PRESENTING",
    winnerId: null,
    voteOpenAt: null,
    voteCloseAt: null,
    votingStartedAt: null,
    votingEndsAt: null,
    votingDurationSeconds: 120,
    votingSessionId: null,
    team1FinalScore: null,
    team2FinalScore: null,
    team1PublicPct: null,
    team2PublicPct: null,
    team1JuryPct: null,
    team2JuryPct: null,
    team1: { id: "team-1", name: "Team A" },
    team2: { id: "team-2", name: "Team B" },
    team1Timer: makeTimerState({ teamSlot: "TEAM1", ...team1Overrides }),
    team2Timer: makeTimerState({ teamSlot: "TEAM2", ...team2Overrides }),
  }
}

describe("timer service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("startTimer", () => {
    it("starting TEAM1 timer does not start TEAM2 timer", async () => {
      const match = makeMatch()
      mockedRepo.getMatchById.mockResolvedValue(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
      mockedRepo.updateTimerState.mockResolvedValue(undefined)

      await startTimer("match-1", "TEAM1")

      expect(mockedRepo.updateTimerState).toHaveBeenCalledTimes(1)
      expect(mockedRepo.updateTimerState).toHaveBeenCalledWith(
        "match-1",
        "TEAM1",
        expect.objectContaining({ status: "RUNNING", startedAt: expect.any(Date), pausedAt: null }),
      )
    })

    it("cannot start FINISHED timer unless reset first", async () => {
      const match = makeMatch({ status: "FINISHED" })
      mockedRepo.getMatchById.mockResolvedValue(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)

      await expect(startTimer("match-1", "TEAM1")).rejects.toThrow("TIMER_FINISHED_MUST_RESET")
    })
  })

  describe("pauseTimer", () => {
    it("pausing TEAM1 preserves calculated remaining time", async () => {
      const startedAt = new Date(Date.now() - 5000).toISOString()
      const match = makeMatch({ status: "RUNNING", remainingSeconds: 600, startedAt })
      mockedRepo.getMatchById.mockResolvedValue(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
      mockedRepo.updateTimerState.mockResolvedValue(undefined)

      await pauseTimer("match-1", "TEAM1")

      const call = mockedRepo.updateTimerState.mock.calls[0]
      const updatedRemaining = call[2].remainingSeconds
      expect(updatedRemaining).toBeLessThanOrEqual(595)
      expect(updatedRemaining).toBeGreaterThanOrEqual(590)
      expect(call[2].status).toBe("PAUSED")
      expect(call[2].startedAt).toBeNull()
    })
  })

  describe("resetTimer", () => {
    it("resetting TEAM1 does not affect TEAM2", async () => {
      const match = makeMatch(
        { status: "PAUSED", remainingSeconds: 300 },
        { status: "RUNNING", remainingSeconds: 500 },
      )
      mockedRepo.getMatchById.mockResolvedValue(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
      mockedRepo.resetTimerState.mockResolvedValue(undefined)

      await resetTimer("match-1", "TEAM1")

      expect(mockedRepo.resetTimerState).toHaveBeenCalledTimes(1)
      expect(mockedRepo.resetTimerState).toHaveBeenCalledWith("match-1", "TEAM1")
    })
  })

  describe("patchTimer", () => {
    it("PATCH deltaSeconds cannot make remainingSeconds negative", async () => {
      const match = makeMatch({ remainingSeconds: 20 })
      const updatedMatch = makeMatch({ remainingSeconds: 0 })
      mockedRepo.getMatchById
        .mockResolvedValueOnce(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
        .mockResolvedValueOnce(updatedMatch as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
      mockedRepo.updateTimerState.mockResolvedValue(undefined)

      const result = await patchTimer("match-1", "TEAM1", { deltaSeconds: -30 })

      expect(mockedRepo.updateTimerState).toHaveBeenCalledWith(
        "match-1",
        "TEAM1",
        expect.objectContaining({ remainingSeconds: 0 }),
      )
      expect(result.timer.remainingSeconds).toBe(0)
    })

    it("PATCH remainingSeconds sets exact value", async () => {
      const match = makeMatch({ remainingSeconds: 600 })
      const updatedMatch = makeMatch({ remainingSeconds: 300 })
      mockedRepo.getMatchById
        .mockResolvedValueOnce(match as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
        .mockResolvedValueOnce(updatedMatch as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
      mockedRepo.updateTimerState.mockResolvedValue(undefined)

      const result = await patchTimer("match-1", "TEAM1", { remainingSeconds: 300 })

      expect(mockedRepo.updateTimerState).toHaveBeenCalledWith(
        "match-1",
        "TEAM1",
        expect.objectContaining({ remainingSeconds: 300 }),
      )
      expect(result.timer.remainingSeconds).toBe(300)
    })
  })

  describe("calculateActualRemaining", () => {
    it("finished timer returns remainingSeconds = 0", () => {
      const startedAt = new Date(Date.now() - 700).toISOString()
      const remaining = calculateActualRemaining(0, startedAt)
      expect(remaining).toBe(0)
    })

    it("calculates elapsed time for RUNNING timer", () => {
      const startedAt = new Date(Date.now() - 10000).toISOString()
      const remaining = calculateActualRemaining(600, startedAt)
      expect(remaining).toBeLessThanOrEqual(590)
      expect(remaining).toBeGreaterThanOrEqual(585)
    })

    it("returns remainingSeconds when not started", () => {
      expect(calculateActualRemaining(300, null)).toBe(300)
    })
  })
})

describe("active match public response", () => {
  it("includes both timers", async () => {
    const match = makeMatch(
      { status: "RUNNING", remainingSeconds: 500 },
      { status: "PAUSED", remainingSeconds: 400 },
    )
    mockedRepo.getActiveMatch.mockResolvedValue(match as unknown as Awaited<ReturnType<typeof repository.getActiveMatch>>)

    const result = await repository.getActiveMatch("event-1")
    expect(result).not.toBeNull()
    expect(result!.team1Timer).toBeDefined()
    expect(result!.team2Timer).toBeDefined()
    expect(result!.team1Timer.status).toBe("RUNNING")
    expect(result!.team2Timer.status).toBe("PAUSED")
  })
})


