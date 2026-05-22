import type { Server as HttpServer } from "node:http";

import type { Server as IOServer, Socket } from "socket.io";

import type { DisplayMode, MatchPhase } from "@/shared/types/domain.types";

export interface ServerToClientEvents {
  "event:state": (payload: {
    displayMode: DisplayMode;
    currentMatchId: string | null;
    matches: Array<{ id: string; phase: MatchPhase }>;
  }) => void;
  "match:phase": (payload: {
    matchId: string;
    phase: MatchPhase;
    timerSecs: number;
  }) => void;
  "timer:tick": (payload: {
    matchId: string;
    secondsLeft: number;
  }) => void;
  "vote:update": (payload: {
    matchId: string;
    publicTeam1: number;
    publicTeam2: number;
    juryTeam1: number;
    juryTeam2: number;
    totalPublic: number;
  }) => void;
  "result:show": (payload: {
    matchId: string;
    team1Final: number;
    team2Final: number;
    winnerId: string | null;
    winnerName: string | null;
    isTie: boolean;
  }) => void;
  "bracket:update": (payload: {
    currentMatchId: string | null;
    completedMatchIds: string[];
    winners: Array<{ matchId: string; teamId: string; teamName: string }>;
  }) => void;
}

export interface ClientToServerEvents {
  "admin:set-display-mode": (payload: {
    displayMode: DisplayMode;
  }) => void;
  "admin:phase": (payload: {
    matchId: string;
    phase: MatchPhase;
  }) => void;
  "admin:timer": (payload: {
    matchId: string;
    action: "play" | "pause" | "reset" | "adjust";
    delta?: number;
  }) => void;
  "admin:open-voting": (payload: { matchId: string }) => void;
  "admin:close-voting": (payload: { matchId: string }) => void;
  "admin:show-result": (payload: { matchId: string }) => void;
  "admin:show-bracket": (payload: { matchId: string }) => void;
  "admin:resolve-tie": (payload: {
    matchId: string;
    winnerId: string;
  }) => void;
  "jury:vote": (payload: {
    matchId: string;
    teamId: string;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  role?: "SUPERADMIN" | "ADMIN" | "JURY";
}

export type TypedServer = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedHttpServer = HttpServer;
