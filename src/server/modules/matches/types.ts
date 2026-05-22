import type { CurrentUser } from "@/server/core/session";

export type MatchPhaseValue =
  | "WAITING"
  | "BRACKET_PREVIEW"
  | "PRESENTING_TEAM1"
  | "PRESENTING_TEAM2"
  | "VOTING"
  | "CLOSED"
  | "WINNER_REVEAL"
  | "BRACKET_UPDATE"
  | "RESULT";

export type TimerAction = "play" | "pause" | "reset" | "adjust";

export interface MatchRecord {
  id: string;
  challengeId: string;
  team1Id: string;
  team2Id: string;
  winnerId: string | null;
  phase: MatchPhaseValue;
  timerSecs: number;
  timerActive: boolean;
  voteOpenAt: Date | null;
  voteCloseAt: Date | null;
  resultShownAt: Date | null;
  updatedAt: Date;
}

export interface ChangeMatchPhaseRequestInput {
  matchId: string;
  phase: MatchPhaseValue;
}

export interface OpenVotingRequestInput {
  matchId: string;
}

export interface CloseVotingRequestInput {
  matchId: string;
}

export interface ChangeMatchPhaseCommand {
  actor: CurrentUser;
}

export interface VotingControlCommand {
  actor: CurrentUser;
}

export interface TimerActionRequestInput {
  matchId: string;
  action: TimerAction;
  delta?: number;
}

export interface TimerActionCommand {
  actor: CurrentUser;
}
