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

export interface VotingTeamSnapshot {
  id: string;
  nameAr: string;
  ideaAr: string;
}

export interface VotingMatchSnapshot {
  id: string;
  phase: MatchPhaseValue;
  team1Id: string;
  team2Id: string;
  team1: VotingTeamSnapshot;
  team2: VotingTeamSnapshot;
}

export interface PublicCurrentVoteState {
  currentMatch: VotingMatchSnapshot | null;
  votingOpen: boolean;
}

export interface PublicVotePayload {
  matchId: string;
  teamId: string;
  fingerprintHash: string;
}

export interface VoteSubmitResponse {
  success: true;
}

export type VoteApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
