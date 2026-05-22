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

export interface VotingMatchSnapshot {
  id: string;
  phase: MatchPhaseValue;
  team1Id: string;
  team2Id: string;
}

export interface CurrentPublicVotingState {
  currentMatch: VotingMatchSnapshot | null;
  votingOpen: boolean;
}

export interface CurrentJuryVotingState extends CurrentPublicVotingState {
  hasVoted: boolean;
}

export interface GetCurrentPublicVotingStateRequestInput {}

export interface GetCurrentJuryVotingStateRequestInput {}

export interface PublicVoteRequestInput {
  matchId: string;
  teamId: string;
  fingerprintHash: string;
}

export interface PublicVoteCommand {
  hashedIp: string;
}

export interface JuryVoteRequestInput {
  matchId: string;
  teamId: string;
}

export interface JuryVoteCommand {
  actor: CurrentUser;
}

export interface VoteInsertResult {
  id: string;
}

export interface DuplicateVoteResult {
  isDuplicate: boolean;
  reason: "IP" | "FINGERPRINT" | null;
}

export interface VoteServiceSuccess {
  success: true;
}
