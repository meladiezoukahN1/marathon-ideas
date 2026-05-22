import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "../src/server/core/session";

vi.mock("../src/server/modules/matches/repository", () => ({
  getMatchById: vi.fn(),
  getCurrentMatchFromEventControl: vi.fn(),
  updateMatchPhaseWithAudit: vi.fn(),
  updateVotingStateWithAudit: vi.fn(),
  applyTimerActionWithAudit: vi.fn(),
}));

import {
  getMatchById,
  updateVotingStateWithAudit,
} from "../src/server/modules/matches/repository";
import { closeVoting, openVoting } from "../src/server/modules/matches/service";

const mockedGetMatchById = vi.mocked(getMatchById);
const mockedUpdateVotingStateWithAudit = vi.mocked(updateVotingStateWithAudit);

describe("matches service voting controls", () => {
  const adminActor: CurrentUser = { id: "admin-1", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects openVoting for non-admin actor", async () => {
    const juryActor: CurrentUser = { id: "jury-1", role: "JURY" };

    await expect(openVoting({ matchId: "m1" }, { actor: juryActor })).rejects.toThrow(
      "Only ADMIN or SUPERADMIN can control matches",
    );
  });

  it("rejects openVoting on illegal transition", async () => {
    mockedGetMatchById.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "RESULT",
      timerSecs: 600,
      timerActive: false,
      voteOpenAt: null,
      voteCloseAt: null,
      resultShownAt: null,
      updatedAt: new Date(),
    });

    await expect(openVoting({ matchId: "m1" }, { actor: adminActor })).rejects.toThrow(
      "Illegal match phase transition",
    );
  });

  it("sets phase VOTING, voteOpenAt, and clears voteCloseAt", async () => {
    mockedGetMatchById.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "PRESENTING_TEAM2",
      timerSecs: 600,
      timerActive: false,
      voteOpenAt: null,
      voteCloseAt: null,
      resultShownAt: null,
      updatedAt: new Date(),
    });
    mockedUpdateVotingStateWithAudit.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "VOTING",
      timerSecs: 600,
      timerActive: false,
      voteOpenAt: new Date("2026-05-23T10:00:00.000Z"),
      voteCloseAt: null,
      resultShownAt: null,
      updatedAt: new Date(),
    });

    const result = await openVoting({ matchId: "m1" }, { actor: adminActor });

    expect(result.phase).toBe("VOTING");
    expect(mockedUpdateVotingStateWithAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: "m1",
        fromPhase: "PRESENTING_TEAM2",
        toPhase: "VOTING",
        actorId: "admin-1",
        auditAction: "VOTING_OPENED",
        voteCloseAt: null,
      }),
    );
    expect(mockedUpdateVotingStateWithAudit.mock.calls[0]?.[0].voteOpenAt).toBeInstanceOf(Date);
  });

  it("rejects closeVoting for non-admin actor", async () => {
    const juryActor: CurrentUser = { id: "jury-1", role: "JURY" };

    await expect(closeVoting({ matchId: "m1" }, { actor: juryActor })).rejects.toThrow(
      "Only ADMIN or SUPERADMIN can control matches",
    );
  });

  it("rejects closeVoting when phase is not VOTING", async () => {
    mockedGetMatchById.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "CLOSED",
      timerSecs: 600,
      timerActive: true,
      voteOpenAt: null,
      voteCloseAt: null,
      resultShownAt: null,
      updatedAt: new Date(),
    });

    await expect(closeVoting({ matchId: "m1" }, { actor: adminActor })).rejects.toThrow(
      "Voting can be closed only while match is in VOTING phase",
    );
  });

  it("sets phase CLOSED, voteCloseAt, and timerActive false", async () => {
    mockedGetMatchById.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "VOTING",
      timerSecs: 600,
      timerActive: true,
      voteOpenAt: new Date("2026-05-23T09:00:00.000Z"),
      voteCloseAt: null,
      resultShownAt: null,
      updatedAt: new Date(),
    });
    mockedUpdateVotingStateWithAudit.mockResolvedValue({
      id: "m1",
      challengeId: "c1",
      team1Id: "t1",
      team2Id: "t2",
      winnerId: null,
      phase: "CLOSED",
      timerSecs: 600,
      timerActive: false,
      voteOpenAt: new Date("2026-05-23T09:00:00.000Z"),
      voteCloseAt: new Date("2026-05-23T10:00:00.000Z"),
      resultShownAt: null,
      updatedAt: new Date(),
    });

    const result = await closeVoting({ matchId: "m1" }, { actor: adminActor });

    expect(result.phase).toBe("CLOSED");
    expect(mockedUpdateVotingStateWithAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: "m1",
        fromPhase: "VOTING",
        toPhase: "CLOSED",
        actorId: "admin-1",
        auditAction: "VOTING_CLOSED",
        timerActive: false,
      }),
    );
    expect(mockedUpdateVotingStateWithAudit.mock.calls[0]?.[0].voteCloseAt).toBeInstanceOf(Date);
  });
});
