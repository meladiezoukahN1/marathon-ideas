import type { DisplayMode, MatchPhase, ResultStatus, UserRole } from "@prisma/client";

export type { DisplayMode, MatchPhase, ResultStatus, UserRole };

export interface TeamPublic {
  id: string;
  nameAr: string;
  ideaAr: string;
}

export interface ChallengePublic {
  id: string;
  slug: string;
  nameAr: string;
  order: number;
}

export interface MatchPublic {
  id: string;
  challengeId: string;
  challenge: ChallengePublic;
  phase: MatchPhase;
  resultStatus: ResultStatus;
  timerSecs: number;
  timerActive: boolean;
  voteOpenAt: string | null;
  voteCloseAt: string | null;
  resultShownAt: string | null;
  team1: TeamPublic;
  team2: TeamPublic;
  winner: TeamPublic | null;
  publicVotesTeam1: number;
  publicVotesTeam2: number;
  juryVotesTeam1: number;
  juryVotesTeam2: number;
}

export interface BracketNode {
  challenge: ChallengePublic;
  team1: TeamPublic;
  team2: TeamPublic;
  winner: TeamPublic | null;
  isCompleted: boolean;
}

export interface BracketState {
  currentMatchId: string | null;
  completedMatchIds: string[];
  nodes: BracketNode[];
}

export interface EventState {
  displayMode: DisplayMode;
  currentMatchId: string | null;
  matches: MatchPublic[];
}
