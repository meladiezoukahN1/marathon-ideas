import { BadRequestError } from "../../core/errors";

const DISPLAY_MODES = [
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

export type DisplayModeValue = (typeof DISPLAY_MODES)[number];

function isDisplayModeValue(value: string): value is DisplayModeValue {
  return DISPLAY_MODES.includes(value as DisplayModeValue);
}

export const DISPLAY_MODE_TRANSITIONS: Record<DisplayModeValue, readonly DisplayModeValue[]> = {
  EVENT_WAITING: ["BRACKET_PREVIEW"],
  BRACKET_PREVIEW: ["PRESENTING_TEAM"],
  PRESENTING_TEAM: ["VOTING"],
  VOTING: ["VOTING_CLOSED"],
  VOTING_CLOSED: ["WINNER_REVEAL"],
  WINNER_REVEAL: ["BRACKET_UPDATE"],
  BRACKET_UPDATE: ["BRACKET_PREVIEW", "FINAL_BRACKET"],
  FINAL_BRACKET: ["EVENT_FINISHED"],
  EVENT_FINISHED: [],
};

export function assertValidDisplayTransition(from: string, to: string): void {
  if (!isDisplayModeValue(from) || !isDisplayModeValue(to)) {
    throw new BadRequestError(`Unsupported display mode transition: ${from} -> ${to}`);
  }

  if (from === to) {
    throw new BadRequestError(`Same-state display transition is not allowed: ${from} -> ${to}`);
  }

  if (!DISPLAY_MODE_TRANSITIONS[from].includes(to)) {
    throw new BadRequestError(`Illegal display transition: ${from} -> ${to}`);
  }
}
