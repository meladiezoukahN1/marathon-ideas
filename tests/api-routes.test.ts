import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/server/core/response", () => ({
  apiSuccess: vi.fn(),
  handleRouteError: vi.fn(),
}));

vi.mock("@/server/core/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/anti-duplicate", () => ({
  hashIp: vi.fn(),
}));

vi.mock("@/server/modules/bracket/service", () => ({
  getEventState: vi.fn(),
}));

vi.mock("@/server/modules/voting/service", () => ({
  getCurrentPublicVotingState: vi.fn(),
  getCurrentJuryVotingState: vi.fn(),
  submitPublicVote: vi.fn(),
  submitJuryVote: vi.fn(),
}));

vi.mock("@/server/modules/event-control/service", () => ({
  changeDisplayMode: vi.fn(),
}));

vi.mock("@/server/modules/matches/service", () => ({
  changeMatchPhase: vi.fn(),
  applyTimerAction: vi.fn(),
  openVoting: vi.fn(),
  closeVoting: vi.fn(),
}));

vi.mock("@/server/modules/results/service", () => ({
  showCalculatedResult: vi.fn(),
  resolveTieResult: vi.fn(),
  getLiveResults: vi.fn(),
}));

import { hashIp } from "@/lib/anti-duplicate";
import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentUser } from "@/server/core/session";
import { getEventState } from "@/server/modules/bracket/service";
import { changeDisplayMode } from "@/server/modules/event-control/service";
import {
  applyTimerAction,
  changeMatchPhase,
  closeVoting,
  openVoting,
} from "@/server/modules/matches/service";
import {
  getLiveResults,
  resolveTieResult,
  showCalculatedResult,
} from "@/server/modules/results/service";
import {
  getCurrentJuryVotingState,
  getCurrentPublicVotingState,
  submitJuryVote,
  submitPublicVote,
} from "@/server/modules/voting/service";

import * as AdminDisplayModeRoute from "../src/app/api/v1/admin/display-mode/route";
import * as AdminMatchPhaseRoute from "../src/app/api/v1/admin/match/phase/route";
import * as AdminResolveTieRoute from "../src/app/api/v1/admin/result/resolve-tie/route";
import * as AdminResultShowRoute from "../src/app/api/v1/admin/result/show/route";
import * as AdminResultsLiveRoute from "../src/app/api/v1/admin/results/live/route";
import * as AdminTimerRoute from "../src/app/api/v1/admin/timer/route";
import * as AdminVotingCloseRoute from "../src/app/api/v1/admin/voting/close/route";
import * as AdminVotingOpenRoute from "../src/app/api/v1/admin/voting/open/route";
import * as EventStateRoute from "../src/app/api/v1/event/state/route";
import * as JuryCurrentRoute from "../src/app/api/v1/jury/current/route";
import * as VoteCurrentRoute from "../src/app/api/v1/vote/current/route";
import * as VoteJuryRoute from "../src/app/api/v1/vote/jury/route";
import * as VotePublicRoute from "../src/app/api/v1/vote/public/route";

const apiSuccessMock = vi.mocked(apiSuccess);
const handleRouteErrorMock = vi.mocked(handleRouteError);
const getCurrentUserMock = vi.mocked(getCurrentUser);
const hashIpMock = vi.mocked(hashIp);

const getEventStateMock = vi.mocked(getEventState);
const getCurrentPublicVotingStateMock = vi.mocked(getCurrentPublicVotingState);
const getCurrentJuryVotingStateMock = vi.mocked(getCurrentJuryVotingState);
const submitPublicVoteMock = vi.mocked(submitPublicVote);
const submitJuryVoteMock = vi.mocked(submitJuryVote);

const changeDisplayModeMock = vi.mocked(changeDisplayMode);
const changeMatchPhaseMock = vi.mocked(changeMatchPhase);
const applyTimerActionMock = vi.mocked(applyTimerAction);
const openVotingMock = vi.mocked(openVoting);
const closeVotingMock = vi.mocked(closeVoting);

const showCalculatedResultMock = vi.mocked(showCalculatedResult);
const resolveTieResultMock = vi.mocked(resolveTieResult);
const getLiveResultsMock = vi.mocked(getLiveResults);

const actor = { id: "actor-1", role: "ADMIN" as const };

function jsonRequest(url: string, body: unknown, headers?: Record<string, string>): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

describe("api route contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiSuccessMock.mockImplementation((data: unknown) => {
      return NextResponse.json({ data, error: null });
    });

    handleRouteErrorMock.mockImplementation(() => {
      return NextResponse.json({ data: null, error: "mapped-error" }, { status: 500 });
    });

    getCurrentUserMock.mockResolvedValue(actor);
    hashIpMock.mockReturnValue("hashed-ip");

    getEventStateMock.mockResolvedValue({ displayMode: "EVENT_WAITING" } as never);
    getCurrentPublicVotingStateMock.mockResolvedValue(
      {
        votingOpen: true,
        currentMatch: {
          id: "m1",
          phase: "VOTING",
          team1Id: "t1",
          team2Id: "t2",
          team1: { id: "t1", nameAr: "فريق ألف", ideaAr: "فكرة ألف" },
          team2: { id: "t2", nameAr: "فريق باء", ideaAr: "فكرة باء" },
        },
      } as never,
    );
    getCurrentJuryVotingStateMock.mockResolvedValue(
      {
        votingOpen: true,
        hasVoted: false,
        currentMatch: {
          id: "m1",
          phase: "VOTING",
          team1Id: "t1",
          team2Id: "t2",
          team1: { id: "t1", nameAr: "فريق ألف", ideaAr: "فكرة ألف" },
          team2: { id: "t2", nameAr: "فريق باء", ideaAr: "فكرة باء" },
        },
      } as never,
    );
    submitPublicVoteMock.mockResolvedValue({ success: true } as never);
    submitJuryVoteMock.mockResolvedValue({ success: true } as never);

    changeDisplayModeMock.mockResolvedValue({ id: "ec1" } as never);
    changeMatchPhaseMock.mockResolvedValue({ id: "m1" } as never);
    applyTimerActionMock.mockResolvedValue({ id: "m1" } as never);
    openVotingMock.mockResolvedValue({ id: "m1" } as never);
    closeVotingMock.mockResolvedValue({ id: "m1" } as never);

    showCalculatedResultMock.mockResolvedValue({ id: "m1" } as never);
    resolveTieResultMock.mockResolvedValue({ id: "m1" } as never);
    getLiveResultsMock.mockResolvedValue({ id: "m1" } as never);
  });

  it("GET /event/state is public and delegates to getEventState", async () => {
    const result = await EventStateRoute.GET();
    const payload = await result.json();

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(getEventStateMock).toHaveBeenCalledTimes(1);
    expect(apiSuccessMock).toHaveBeenCalledWith({ displayMode: "EVENT_WAITING" });
    expect(payload).toEqual({ data: { displayMode: "EVENT_WAITING" }, error: null });
  });

  it("GET /vote/current is public and delegates to getCurrentPublicVotingState", async () => {
    const result = await VoteCurrentRoute.GET();
    const payload = await result.json();

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(getCurrentPublicVotingStateMock).toHaveBeenCalledWith({});
    expect(payload).toEqual({
      data: {
        votingOpen: true,
        currentMatch: {
          id: "m1",
          phase: "VOTING",
          team1Id: "t1",
          team2Id: "t2",
          team1: { id: "t1", nameAr: "فريق ألف", ideaAr: "فكرة ألف" },
          team2: { id: "t2", nameAr: "فريق باء", ideaAr: "فكرة باء" },
        },
      },
      error: null,
    });
  });

  it("POST /vote/public is public and delegates to submitPublicVote", async () => {
    const body = { matchId: "match-1", teamId: "t1", fingerprintHash: "fp-1" };
    const request = jsonRequest("http://localhost/api/v1/vote/public", body, {
      "x-forwarded-for": "203.0.113.9, 198.51.100.7",
    });

    const result = await VotePublicRoute.POST(request);
    const payload = await result.json();

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(hashIpMock).toHaveBeenCalledWith("203.0.113.9", "match-1");
    expect(submitPublicVoteMock).toHaveBeenCalledWith(body, { hashedIp: "hashed-ip" });
    expect(JSON.stringify(submitPublicVoteMock.mock.calls[0])).not.toContain("203.0.113.9");
    expect(payload).toEqual({ data: { success: true }, error: null });
  });

  it("POST /vote/public uses x-real-ip fallback", async () => {
    const body = { matchId: "match-2", teamId: "t2", fingerprintHash: "fp-2" };
    const request = jsonRequest("http://localhost/api/v1/vote/public", body, {
      "x-real-ip": "198.51.100.25",
    });

    await VotePublicRoute.POST(request);

    expect(hashIpMock).toHaveBeenCalledWith("198.51.100.25", "match-2");
  });

  it("POST /vote/public uses unknown fallback when headers are missing", async () => {
    const body = { matchId: "match-3", teamId: "t2", fingerprintHash: "fp-3" };
    const request = jsonRequest("http://localhost/api/v1/vote/public", body);

    await VotePublicRoute.POST(request);

    expect(hashIpMock).toHaveBeenCalledWith("unknown", "match-3");
  });

  it("GET /jury/current requires auth and delegates to getCurrentJuryVotingState", async () => {
    const result = await JuryCurrentRoute.GET();
    const payload = await result.json();

    expect(getCurrentUserMock).toHaveBeenCalledWith(true);
    expect(getCurrentJuryVotingStateMock).toHaveBeenCalledWith({}, { actor });
    expect(payload).toEqual({
      data: {
        votingOpen: true,
        hasVoted: false,
        currentMatch: {
          id: "m1",
          phase: "VOTING",
          team1Id: "t1",
          team2Id: "t2",
          team1: { id: "t1", nameAr: "فريق ألف", ideaAr: "فكرة ألف" },
          team2: { id: "t2", nameAr: "فريق باء", ideaAr: "فكرة باء" },
        },
      },
      error: null,
    });
  });

  it("POST /vote/jury requires auth and delegates to submitJuryVote", async () => {
    const body = { matchId: "m1", teamId: "t1" };
    const request = jsonRequest("http://localhost/api/v1/vote/jury", body);

    const result = await VoteJuryRoute.POST(request);
    const payload = await result.json();

    expect(getCurrentUserMock).toHaveBeenCalledWith(true);
    expect(submitJuryVoteMock).toHaveBeenCalledWith(body, { actor });
    expect(payload).toEqual({ data: { success: true }, error: null });
  });

  it("admin routes require auth and delegate to correct services", async () => {
    const displayBody = { displayMode: "VOTING" };
    await AdminDisplayModeRoute.POST(
      jsonRequest("http://localhost/api/v1/admin/display-mode", displayBody),
    );
    expect(changeDisplayModeMock).toHaveBeenCalledWith(displayBody, { actor });

    const phaseBody = { matchId: "m1", phase: "VOTING" };
    await AdminMatchPhaseRoute.POST(jsonRequest("http://localhost/api/v1/admin/match/phase", phaseBody));
    expect(changeMatchPhaseMock).toHaveBeenCalledWith(phaseBody, { actor });

    const timerBody = { matchId: "m1", action: "pause" };
    await AdminTimerRoute.POST(jsonRequest("http://localhost/api/v1/admin/timer", timerBody));
    expect(applyTimerActionMock).toHaveBeenCalledWith(timerBody, { actor });

    const openBody = { matchId: "m1" };
    await AdminVotingOpenRoute.POST(jsonRequest("http://localhost/api/v1/admin/voting/open", openBody));
    expect(openVotingMock).toHaveBeenCalledWith(openBody, { actor });

    const closeBody = { matchId: "m1" };
    await AdminVotingCloseRoute.POST(jsonRequest("http://localhost/api/v1/admin/voting/close", closeBody));
    expect(closeVotingMock).toHaveBeenCalledWith(closeBody, { actor });

    const showBody = { matchId: "m1" };
    await AdminResultShowRoute.POST(jsonRequest("http://localhost/api/v1/admin/result/show", showBody));
    expect(showCalculatedResultMock).toHaveBeenCalledWith(showBody, { actor });

    const tieBody = { matchId: "m1", winnerId: "t1" };
    await AdminResolveTieRoute.POST(
      jsonRequest("http://localhost/api/v1/admin/result/resolve-tie", tieBody),
    );
    expect(resolveTieResultMock).toHaveBeenCalledWith(tieBody, { actor });

    await AdminResultsLiveRoute.GET(
      new Request("http://localhost/api/v1/admin/results/live?matchId=match-live"),
    );
    expect(getLiveResultsMock).toHaveBeenCalledWith({ matchId: "match-live" }, { actor });

    expect(getCurrentUserMock).toHaveBeenCalledWith(true);
    expect(getCurrentUserMock).toHaveBeenCalledTimes(8);
  });

  it("public route errors are handled through handleRouteError", async () => {
    const serviceError = new Error("public failure");
    getEventStateMock.mockRejectedValueOnce(serviceError);

    const result = await EventStateRoute.GET();
    const payload = await result.json();

    expect(handleRouteErrorMock).toHaveBeenCalledWith(serviceError);
    expect(payload).toEqual({ data: null, error: "mapped-error" });
    expect(result).not.toBe(serviceError);
  });

  it("protected route errors are handled through handleRouteError", async () => {
    const serviceError = new Error("jury failure");
    getCurrentJuryVotingStateMock.mockRejectedValueOnce(serviceError);

    const result = await JuryCurrentRoute.GET();
    const payload = await result.json();

    expect(handleRouteErrorMock).toHaveBeenCalledWith(serviceError);
    expect(payload).toEqual({ data: null, error: "mapped-error" });
    expect(result).not.toBe(serviceError);
  });

  it("admin route errors are handled through handleRouteError", async () => {
    const serviceError = new Error("admin failure");
    changeDisplayModeMock.mockRejectedValueOnce(serviceError);

    const result = await AdminDisplayModeRoute.POST(
      jsonRequest("http://localhost/api/v1/admin/display-mode", { displayMode: "VOTING" }),
    );
    const payload = await result.json();

    expect(handleRouteErrorMock).toHaveBeenCalledWith(serviceError);
    expect(payload).toEqual({ data: null, error: "mapped-error" });
    expect(result).not.toBe(serviceError);
  });
});
