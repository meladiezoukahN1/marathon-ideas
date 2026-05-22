import { z } from "zod";

import type { ChangeDisplayModeRequestInput } from "./types";

export const DISPLAY_MODE_VALUES = [
  "EVENT_WAITING",
  "BRACKET_PREVIEW",
  "PRESENTING_TEAM",
  "VOTING",
  "VOTING_CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "FINAL_BRACKET",
  "EVENT_FINISHED",
] as const;

const changeDisplayModeSchema = z.object({
  displayMode: z.enum(DISPLAY_MODE_VALUES),
});

// Validates request input only. Current mode is loaded from repository in service.ts.
export function validateChangeDisplayModeInput(
  input: unknown,
): ChangeDisplayModeRequestInput {
  return changeDisplayModeSchema.parse(input);
}
