import type { CurrentUser } from "../../core/session";

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

export type ResultStatusValue =
  | "NOT_CALCULATED"
  | "CALCULATED"
  | "TIE_PENDING"
  | "TIE_RESOLVED";

export interface ResultMatchSnapshot {
  id: string;
  phase: MatchPhaseValue;
  team1Id: string;
  team2Id: string;
  resultStatus: ResultStatusValue;
}

export interface LiveResultSnapshot {
  id: string;
  phase: MatchPhaseValue;
  resultStatus: ResultStatusValue;
  winnerId: string | null;
  team1Final: number | null;
  team2Final: number | null;
  resultShownAt: Date | null;
}

export interface MatchVoteTotals {
  activeJuryCount: number;
  juryVotesTeam1: number;
  juryVotesTeam2: number;
  publicVotesTeam1: number;
  publicVotesTeam2: number;
}

export interface ShowResultRequestInput {
  matchId: string;
}

export interface LiveResultRequestInput {
  matchId: string;
}

export interface ResolveTieRequestInput {
  matchId: string;
  winnerId: string;
}

export interface ResultMutationCommand {
  actor: CurrentUser;
}

export interface LiveResultCommand {
  actor: CurrentUser;
}

export interface ResultMutationResult {
  id: string;
  resultStatus: ResultStatusValue;
  winnerId: string | null;
  team1Final: number | null;
  team2Final: number | null;
  resultShownAt: Date | null;
}
