import type { CurrentUser } from "@/server/core/session";

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

export interface EventControlRecord {
  id: string;
  displayMode: DisplayModeValue;
  currentMatchId: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}

export interface ChangeDisplayModeRequestInput {
  displayMode: DisplayModeValue;
}

export interface ChangeDisplayModeCommand {
  displayMode: DisplayModeValue;
  actor: CurrentUser;
}
