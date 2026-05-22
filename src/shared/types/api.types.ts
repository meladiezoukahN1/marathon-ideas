import type { BracketState, EventState } from "@/shared/types/domain.types";

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export interface PublicVoteRequest {
  matchId: string;
  teamId: string;
  fingerprintHash: string;
}

export interface JuryVoteRequest {
  matchId: string;
  teamId: string;
}

export interface AdminDisplayModeRequest {
  displayMode:
    | "EVENT_WAITING"
    | "BRACKET_PREVIEW"
    | "PRESENTING_TEAM"
    | "VOTING"
    | "VOTING_CLOSED"
    | "WINNER_REVEAL"
    | "BRACKET_UPDATE"
    | "FINAL_BRACKET"
    | "EVENT_FINISHED";
}

export interface AdminPhaseRequest {
  matchId: string;
  phase:
    | "WAITING"
    | "BRACKET_PREVIEW"
    | "PRESENTING_TEAM1"
    | "PRESENTING_TEAM2"
    | "VOTING"
    | "CLOSED"
    | "WINNER_REVEAL"
    | "BRACKET_UPDATE"
    | "RESULT";
}

export interface AdminTimerRequest {
  matchId: string;
  action: "play" | "pause" | "reset" | "adjust";
  delta?: number;
}

export interface AdminShowResultRequest {
  matchId: string;
}

export interface AdminResolveTieRequest {
  matchId: string;
  winnerId: string;
}

export interface VoteResultResponse {
  matchId: string;
  team1Final: number;
  team2Final: number;
  winnerId: string | null;
  winnerName: string | null;
  isTie: boolean;
}

export type BracketStateResponse = ApiResponse<BracketState>;
export type EventStateResponse = ApiResponse<EventState>;
