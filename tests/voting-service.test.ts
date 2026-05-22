import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "../src/server/core/session";

vi.mock("../src/server/modules/voting/repository", () => ({
  getCurrentVotingMatchFromEventControl: vi.fn(),
  getVotingMatchById: vi.fn(),
  checkPublicVoteDuplicate: vi.fn(),
  insertPublicVote: vi.fn(),
  hasJuryVote: vi.fn(),
  insertJuryVote: vi.fn(),
}));

import {
  checkPublicVoteDuplicate,
  getCurrentVotingMatchFromEventControl,
  getVotingMatchById,
  hasJuryVote,
  insertJuryVote,
  insertPublicVote,
} from "../src/server/modules/voting/repository";
import {
  getCurrentJuryVotingState,
  getCurrentPublicVotingState,
  submitJuryVote,
  submitPublicVote,
} from "../src/server/modules/voting/service";

const mockedGetCurrentVotingMatchFromEventControl = vi.mocked(getCurrentVotingMatchFromEventControl);
const mockedGetVotingMatchById = vi.mocked(getVotingMatchById);
const mockedCheckPublicVoteDuplicate = vi.mocked(checkPublicVoteDuplicate);
const mockedInsertPublicVote = vi.mocked(insertPublicVote);
const mockedHasJuryVote = vi.mocked(hasJuryVote);
const mockedInsertJuryVote = vi.mocked(insertJuryVote);

describe("voting service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no-current-match public state", async () => {
    mockedGetCurrentVotingMatchFromEventControl.mockResolvedValue(null);

    await expect(getCurrentPublicVotingState({})).resolves.toEqual({
      currentMatch: null,
      votingOpen: false,
    });
  });

  it("returns votingOpen false when current match is not VOTING", async () => {
    mockedGetCurrentVotingMatchFromEventControl.mockResolvedValue({
      id: "m1",
      phase: "CLOSED",
      team1Id: "t1",
      team2Id: "t2",
    });

    await expect(getCurrentPublicVotingState({})).resolves.toEqual({
      currentMatch: {
        id: "m1",
        phase: "CLOSED",
        team1Id: "t1",
        team2Id: "t2",
      },
      votingOpen: false,
    });
  });

  it("returns votingOpen true when current match is VOTING", async () => {
    mockedGetCurrentVotingMatchFromEventControl.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });

    await expect(getCurrentPublicVotingState({})).resolves.toEqual({
      currentMatch: {
        id: "m1",
        phase: "VOTING",
        team1Id: "t1",
        team2Id: "t2",
      },
      votingOpen: true,
    });
  });

  it("returns jury voting state with hasVoted false", async () => {
    const actor: CurrentUser = { id: "u1", role: "JURY" };

    mockedGetCurrentVotingMatchFromEventControl.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });
    mockedHasJuryVote.mockResolvedValue(false);

    await expect(getCurrentJuryVotingState({}, { actor })).resolves.toEqual({
      currentMatch: {
        id: "m1",
        phase: "VOTING",
        team1Id: "t1",
        team2Id: "t2",
      },
      votingOpen: true,
      hasVoted: false,
    });
  });

  it("returns jury voting state with hasVoted true", async () => {
    const actor: CurrentUser = { id: "u1", role: "JURY" };

    mockedGetCurrentVotingMatchFromEventControl.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });
    mockedHasJuryVote.mockResolvedValue(true);

    await expect(getCurrentJuryVotingState({}, { actor })).resolves.toEqual({
      currentMatch: {
        id: "m1",
        phase: "VOTING",
        team1Id: "t1",
        team2Id: "t2",
      },
      votingOpen: true,
      hasVoted: true,
    });
  });

  it("rejects jury voting state for non-JURY actor", async () => {
    const actor: CurrentUser = { id: "u1", role: "ADMIN" };

    await expect(getCurrentJuryVotingState({}, { actor })).rejects.toThrow(
      "Only JURY users can submit jury votes",
    );
  });

  it("rejects public vote when match phase is not VOTING", async () => {
    mockedGetVotingMatchById.mockResolvedValue({
      id: "m1",
      phase: "CLOSED",
      team1Id: "t1",
      team2Id: "t2",
    });

    await expect(
      submitPublicVote(
        { matchId: "m1", teamId: "t1", fingerprintHash: "fp" },
        { hashedIp: "hash" },
      ),
    ).rejects.toThrow("Voting is allowed only during VOTING phase");
  });

  it("rejects public vote when team does not belong to match", async () => {
    mockedGetVotingMatchById.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });

    await expect(
      submitPublicVote(
        { matchId: "m1", teamId: "t9", fingerprintHash: "fp" },
        { hashedIp: "hash" },
      ),
    ).rejects.toThrow("Selected team does not belong to this match");
  });

  it("rejects duplicate public vote by hashed IP", async () => {
    mockedGetVotingMatchById.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });
    mockedCheckPublicVoteDuplicate.mockResolvedValue({
      isDuplicate: true,
      reason: "IP",
    });

    await expect(
      submitPublicVote(
        { matchId: "m1", teamId: "t1", fingerprintHash: "fp" },
        { hashedIp: "hash" },
      ),
    ).rejects.toThrow("Duplicate public vote detected by IP");

    expect(mockedInsertPublicVote).not.toHaveBeenCalled();
  });

  it("rejects duplicate public vote by fingerprint", async () => {
    mockedGetVotingMatchById.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });
    mockedCheckPublicVoteDuplicate.mockResolvedValue({
      isDuplicate: true,
      reason: "FINGERPRINT",
    });

    await expect(
      submitPublicVote(
        { matchId: "m1", teamId: "t1", fingerprintHash: "fp" },
        { hashedIp: "hash" },
      ),
    ).rejects.toThrow("Duplicate public vote detected by FINGERPRINT");

    expect(mockedInsertPublicVote).not.toHaveBeenCalled();
  });

  it("rejects jury vote from non-JURY actor", async () => {
    const actor: CurrentUser = { id: "u1", role: "ADMIN" };

    await expect(
      submitJuryVote({ matchId: "m1", teamId: "t1" }, { actor }),
    ).rejects.toThrow("Only JURY users can submit jury votes");
  });

  it("rejects duplicate jury vote", async () => {
    const actor: CurrentUser = { id: "u1", role: "JURY" };

    mockedGetVotingMatchById.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
    });
    mockedHasJuryVote.mockResolvedValue(true);

    await expect(
      submitJuryVote({ matchId: "m1", teamId: "t1" }, { actor }),
    ).rejects.toThrow("Jury user already voted for this match");

    expect(mockedInsertJuryVote).not.toHaveBeenCalled();
  });
});
