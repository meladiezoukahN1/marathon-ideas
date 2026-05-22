import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "../src/server/core/session";

vi.mock("../src/server/modules/results/repository", () => ({
  getResultMatchById: vi.fn(),
  getLiveResultMatchById: vi.fn(),
  getMatchVoteTotals: vi.fn(),
  saveCalculatedResultWithAudit: vi.fn(),
  resolveTieWithAudit: vi.fn(),
}));

import {
  getLiveResultMatchById,
  getMatchVoteTotals,
  getResultMatchById,
  resolveTieWithAudit,
  saveCalculatedResultWithAudit,
} from "../src/server/modules/results/repository";
import {
  getLiveResults,
  resolveTieResult,
  showCalculatedResult,
} from "../src/server/modules/results/service";

const mockedGetLiveResultMatchById = vi.mocked(getLiveResultMatchById);
const mockedGetResultMatchById = vi.mocked(getResultMatchById);
const mockedGetMatchVoteTotals = vi.mocked(getMatchVoteTotals);
const mockedSaveCalculatedResultWithAudit = vi.mocked(saveCalculatedResultWithAudit);
const mockedResolveTieWithAudit = vi.mocked(resolveTieWithAudit);

describe("results service", () => {
  const adminActor: CurrentUser = { id: "admin-1", role: "ADMIN" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects live results for JURY", async () => {
    const actor: CurrentUser = { id: "jury-1", role: "JURY" };

    await expect(getLiveResults({ matchId: "m1" }, { actor })).rejects.toThrow(
      "Only ADMIN or SUPERADMIN can view live results",
    );
  });

  it("rejects live results for null actor if provided", async () => {
    await expect(
      getLiveResults({ matchId: "m1" }, { actor: null as any }),
    ).rejects.toThrow("Only ADMIN or SUPERADMIN can view live results");
  });

  it("allows live results for ADMIN", async () => {
    mockedGetLiveResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });

    await expect(getLiveResults({ matchId: "m1" }, { actor: adminActor })).resolves.toEqual({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });
  });

  it("allows live results for SUPERADMIN", async () => {
    const actor: CurrentUser = { id: "root-1", role: "SUPERADMIN" };

    mockedGetLiveResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "CLOSED",
      resultStatus: "TIE_PENDING",
      winnerId: null,
      team1Final: 50,
      team2Final: 50,
      resultShownAt: null,
    });

    await expect(getLiveResults({ matchId: "m1" }, { actor })).resolves.toEqual({
      id: "m1",
      phase: "CLOSED",
      resultStatus: "TIE_PENDING",
      winnerId: null,
      team1Final: 50,
      team2Final: 50,
      resultShownAt: null,
    });
  });

  it("returns persisted fields only", async () => {
    mockedGetLiveResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });

    const result = await getLiveResults({ matchId: "m1" }, { actor: adminActor });

    expect(result).toEqual({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });
  });

  it("does not calculate result", async () => {
    mockedGetLiveResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });

    await getLiveResults({ matchId: "m1" }, { actor: adminActor });

    expect(mockedGetMatchVoteTotals).not.toHaveBeenCalled();
    expect(mockedSaveCalculatedResultWithAudit).not.toHaveBeenCalled();
    expect(mockedResolveTieWithAudit).not.toHaveBeenCalled();
  });

  it("does not write audit", async () => {
    mockedGetLiveResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 61.2,
      team2Final: 38.8,
      resultShownAt: new Date("2026-05-01T10:00:00.000Z"),
    });

    await getLiveResults({ matchId: "m1" }, { actor: adminActor });

    expect(mockedSaveCalculatedResultWithAudit).not.toHaveBeenCalled();
    expect(mockedResolveTieWithAudit).not.toHaveBeenCalled();
  });

  it("rejects missing match", async () => {
    mockedGetLiveResultMatchById.mockResolvedValue(null);

    await expect(getLiveResults({ matchId: "missing" }, { actor: adminActor })).rejects.toThrow(
      "Match not found: missing",
    );
  });

  it("derives active jury count from repository and sets TIE_PENDING on tie", async () => {
    mockedGetResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "CLOSED",
      team1Id: "t1",
      team2Id: "t2",
      resultStatus: "NOT_CALCULATED",
    });
    mockedGetMatchVoteTotals.mockResolvedValue({
      activeJuryCount: 5,
      juryVotesTeam1: 3,
      juryVotesTeam2: 2,
      publicVotesTeam1: 35,
      publicVotesTeam2: 65,
    });
    mockedSaveCalculatedResultWithAudit.mockResolvedValue({
      id: "m1",
      resultStatus: "TIE_PENDING",
      winnerId: null,
      team1Final: 50,
      team2Final: 50,
      resultShownAt: new Date(),
    });

    const result = await showCalculatedResult({ matchId: "m1" }, { actor: adminActor });

    expect(result.resultStatus).toBe("TIE_PENDING");
    expect(result.winnerId).toBeNull();
    expect(mockedGetMatchVoteTotals).toHaveBeenCalled();
    expect(mockedSaveCalculatedResultWithAudit).toHaveBeenCalledWith(
      expect.objectContaining({ resultStatus: "TIE_PENDING", winnerId: null }),
    );
  });

  it("sets CALCULATED and winner when non-tie", async () => {
    mockedGetResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "CLOSED",
      team1Id: "t1",
      team2Id: "t2",
      resultStatus: "NOT_CALCULATED",
    });
    mockedGetMatchVoteTotals.mockResolvedValue({
      activeJuryCount: 6,
      juryVotesTeam1: 4,
      juryVotesTeam2: 2,
      publicVotesTeam1: 45,
      publicVotesTeam2: 55,
    });
    mockedSaveCalculatedResultWithAudit.mockResolvedValue({
      id: "m1",
      resultStatus: "CALCULATED",
      winnerId: "t1",
      team1Final: 58,
      team2Final: 42,
      resultShownAt: new Date(),
    });

    const result = await showCalculatedResult({ matchId: "m1" }, { actor: adminActor });

    expect(result.resultStatus).toBe("CALCULATED");
    expect(result.winnerId).toBe("t1");
    expect(mockedSaveCalculatedResultWithAudit).toHaveBeenCalledWith(
      expect.objectContaining({ resultStatus: "CALCULATED", winnerId: "t1" }),
    );
  });

  it("rejects result show before CLOSED", async () => {
    mockedGetResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "VOTING",
      team1Id: "t1",
      team2Id: "t2",
      resultStatus: "NOT_CALCULATED",
    });

    await expect(showCalculatedResult({ matchId: "m1" }, { actor: adminActor })).rejects.toThrow(
      "Result calculation/show is allowed only when match is CLOSED or later",
    );
  });

  it("rejects tie resolution if winner does not belong to match", async () => {
    mockedGetResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      team1Id: "t1",
      team2Id: "t2",
      resultStatus: "TIE_PENDING",
    });

    await expect(
      resolveTieResult({ matchId: "m1", winnerId: "t9" }, { actor: adminActor }),
    ).rejects.toThrow("Tie winner must belong to the match");
  });

  it("invokes transactional tie resolve mutation", async () => {
    mockedGetResultMatchById.mockResolvedValue({
      id: "m1",
      phase: "RESULT",
      team1Id: "t1",
      team2Id: "t2",
      resultStatus: "TIE_PENDING",
    });
    mockedResolveTieWithAudit.mockResolvedValue({
      id: "m1",
      resultStatus: "TIE_RESOLVED",
      winnerId: "t1",
      team1Final: 50,
      team2Final: 50,
      resultShownAt: new Date(),
    });

    const result = await resolveTieResult({ matchId: "m1", winnerId: "t1" }, { actor: adminActor });

    expect(result.resultStatus).toBe("TIE_RESOLVED");
    expect(mockedResolveTieWithAudit).toHaveBeenCalledWith({
      matchId: "m1",
      winnerId: "t1",
      actorId: "admin-1",
    });
  });
});
