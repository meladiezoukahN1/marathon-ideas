import { calculateAndStoreResult } from "@/server/modules/matches/service"
import * as repository from "@/server/modules/matches/repository"
import * as votingService from "@/server/modules/voting/service"

jest.mock("@/server/modules/matches/repository")
jest.mock("@/server/modules/voting/service")

const mockedRepo = jest.mocked(repository)
const mockedVoting = jest.mocked(votingService)

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    name: "Test Match",
    order: 1,
    status: "ACTIVE",
    phase: "VOTING",
    winnerId: null,
    voteOpenAt: "2026-06-01T00:00:00.000Z",
    voteCloseAt: null,
    votingStartedAt: "2026-06-01T00:00:00.000Z",
    votingEndsAt: "2026-06-01T00:05:00.000Z",
    votingDurationSeconds: 120,
    votingSessionId: "session-1",
    votingTimerStatus: "FINISHED",
    votingTimerPausedAt: null,
    team1FinalScore: null,
    team2FinalScore: null,
    team1PublicPct: null,
    team2PublicPct: null,
    team1JuryPct: null,
    team2JuryPct: null,
    team1: { id: "team-1", name: "Team A", imageUrl: null },
    team2: { id: "team-2", name: "Team B", imageUrl: null },
    team1Timer: {
      matchId: "match-1", teamSlot: "TEAM1", durationSeconds: 600,
      remainingSeconds: 0, status: "FINISHED", startedAt: null, pausedAt: null, updatedAt: "2026-06-01T00:00:00.000Z",
    },
    team2Timer: {
      matchId: "match-1", teamSlot: "TEAM2", durationSeconds: 600,
      remainingSeconds: 0, status: "FINISHED", startedAt: null, pausedAt: null, updatedAt: "2026-06-01T00:00:00.000Z",
    },
    ...overrides,
  }
}

describe("calculateAndStoreResult", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedRepo.getMatchById.mockResolvedValue(makeMatch() as unknown as Awaited<ReturnType<typeof repository.getMatchById>>)
    mockedRepo.storeResult.mockResolvedValue(undefined)
    mockedRepo.updateChallengePhase.mockResolvedValue(undefined)
  })

  it("no votes => tieReason NO_VOTES, scores 50/50", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 0, team2Public: 0, totalPublic: 0,
      team1Jury: 0, team2Jury: 0, totalJury: 0,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBeNull()
    expect(result.isTie).toBe(true)
    expect(result.tieReason).toBe("NO_VOTES")
    expect(result.team1FinalScore).toBe(50)
    expect(result.team2FinalScore).toBe(50)
    expect(result.team1PublicPct).toBe(0)
    expect(result.team2PublicPct).toBe(0)
    expect(result.team1JuryPct).toBe(0)
    expect(result.team2JuryPct).toBe(0)
  })

  it("equal scores => tieReason EQUAL_SCORE, winnerId null", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 50, team2Public: 50, totalPublic: 100,
      team1Jury: 3, team2Jury: 3, totalJury: 6,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBeNull()
    expect(result.isTie).toBe(true)
    expect(result.tieReason).toBe("EQUAL_SCORE")
    expect(result.team1FinalScore).toBe(result.team2FinalScore)
  })

  it("team1 wins => winnerId set, isTie false, tieReason null", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 80, team2Public: 20, totalPublic: 100,
      team1Jury: 4, team2Jury: 1, totalJury: 5,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBe("team-1")
    expect(result.isTie).toBe(false)
    expect(result.tieReason).toBeNull()
  })

  it("team2 wins => winnerId set, isTie false, tieReason null", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 20, team2Public: 80, totalPublic: 100,
      team1Jury: 1, team2Jury: 4, totalJury: 5,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBe("team-2")
    expect(result.isTie).toBe(false)
    expect(result.tieReason).toBeNull()
  })

  it("public-only votes, no jury => scores from public only", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 70, team2Public: 30, totalPublic: 100,
      team1Jury: 0, team2Jury: 0, totalJury: 0,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBe("team-1")
    expect(result.team1FinalScore).toBe(70)
    expect(result.team2FinalScore).toBe(30)
  })

  it("jury-only votes, no public => scores from jury only", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 0, team2Public: 0, totalPublic: 0,
      team1Jury: 3, team2Jury: 2, totalJury: 5,
    })

    const result = await calculateAndStoreResult("match-1")

    expect(result.winnerId).toBe("team-1")
    expect(result.team1JuryPct).toBe(60)
    expect(result.team2JuryPct).toBe(40)
  })

  it("stores result via repository", async () => {
    mockedVoting.getVoteCounts.mockResolvedValue({
      team1Public: 60, team2Public: 40, totalPublic: 100,
      team1Jury: 3, team2Jury: 2, totalJury: 5,
    })

    await calculateAndStoreResult("match-1")

    expect(mockedRepo.storeResult).toHaveBeenCalledTimes(1)
    const stored = mockedRepo.storeResult.mock.calls[0][1]
    expect(stored.winnerId).toBe("team-1")
    expect(stored.team1FinalScore).toBeGreaterThan(50)
  })
})
