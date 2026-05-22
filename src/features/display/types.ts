import type { BracketNode, EventState, MatchPublic, TeamPublic } from "@/shared/types/domain.types";

export type SupportedDisplayMode =
  | "EVENT_WAITING"
  | "BRACKET_PREVIEW"
  | "PRESENTING_TEAM"
  | "VOTING"
  | "VOTING_CLOSED"
  | "WINNER_REVEAL"
  | "BRACKET_UPDATE"
  | "FINAL_BRACKET"
  | "EVENT_FINISHED";

export interface TeamPresentationModel {
  challengeName: string;
  team: TeamPublic;
  timerSecs: number;
}

export interface VotingDisplayModel {
  challengeName: string;
  team1: TeamPublic;
  team2: TeamPublic;
  timerSecs: number;
  voteClosed: boolean;
}

export interface WinnerRevealModel {
  challengeName: string;
  winner: TeamPublic | null;
  team1Score: number;
  team2Score: number;
}

export interface DisplayViewModel {
  mode: SupportedDisplayMode;
  eventState: EventState;
  currentMatch: MatchPublic | null;
  bracketNodes: BracketNode[];
  teamPresentation: TeamPresentationModel | null;
  votingDisplay: VotingDisplayModel | null;
  winnerReveal: WinnerRevealModel | null;
}

export type DisplayDataResult =
  | { status: "ok"; view: DisplayViewModel }
  | { status: "missing_app_url" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string };
