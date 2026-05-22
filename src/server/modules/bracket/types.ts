export type DisplayModeValue =
  | "EVENT_WAITING"
  | "BRACKET_PREVIEW"
  | "PRESENTING_TEAM"
  | "VOTING"
  | "VOTING_CLOSED"
  | "WINNER_REVEAL"
  | "BRACKET_UPDATE"
  | "FINAL_BRACKET"
  | "EVENT_FINISHED";

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

export interface BracketEventControlSnapshot {
  displayMode: DisplayModeValue;
  currentMatchId: string | null;
}

export interface BracketTeamRow {
  id: string;
  nameAr: string;
  ideaAr: string;
}

export interface BracketChallengeRow {
  id: string;
  slug: string;
  nameAr: string;
  order: number;
}

export interface BracketMatchRow {
  id: string;
  challengeId: string;
  phase: MatchPhaseValue;
  resultStatus: ResultStatusValue;
  timerSecs: number;
  timerActive: boolean;
  voteOpenAt: Date | null;
  voteCloseAt: Date | null;
  resultShownAt: Date | null;
  team1: BracketTeamRow;
  team2: BracketTeamRow;
  winner: BracketTeamRow | null;
}

export interface BracketChallengeWithMatchRow extends BracketChallengeRow {
  match: BracketMatchRow | null;
}

export interface VoteCountRow {
  matchId: string;
  teamId: string;
  count: number;
}

export interface BracketRepositorySnapshot {
  eventControl: BracketEventControlSnapshot | null;
  challenges: BracketChallengeWithMatchRow[];
  publicVoteCounts: VoteCountRow[];
  juryVoteCounts: VoteCountRow[];
}
