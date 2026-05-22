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

export interface JuryVotingMatchSnapshot {
  id: string;
  phase: MatchPhaseValue;
  team1Id: string;
  team2Id: string;
}

export interface CurrentJuryVoteState {
  currentMatch: JuryVotingMatchSnapshot | null;
  votingOpen: boolean;
  hasVoted: boolean;
}

export interface JuryVotePayload {
  matchId: string;
  teamId: string;
}

export interface JuryVoteSubmitResponse {
  success: true;
}

export type JuryApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
