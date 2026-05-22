import { BadRequestError } from "../../core/errors";

const MATCH_PHASES = [
  "WAITING",
  "BRACKET_PREVIEW",
  "PRESENTING_TEAM1",
  "PRESENTING_TEAM2",
  "VOTING",
  "CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "RESULT",
] as const;

export type MatchPhaseValue = (typeof MATCH_PHASES)[number];

function isMatchPhaseValue(value: string): value is MatchPhaseValue {
  return MATCH_PHASES.includes(value as MatchPhaseValue);
}

export const MATCH_PHASE_TRANSITIONS: Record<MatchPhaseValue, readonly MatchPhaseValue[]> = {
  WAITING: ["BRACKET_PREVIEW"],
  BRACKET_PREVIEW: ["PRESENTING_TEAM1"],
  PRESENTING_TEAM1: ["PRESENTING_TEAM2"],
  PRESENTING_TEAM2: ["VOTING"],
  VOTING: ["CLOSED"],
  CLOSED: ["WINNER_REVEAL"],
  WINNER_REVEAL: ["BRACKET_UPDATE"],
  BRACKET_UPDATE: ["RESULT"],
  RESULT: [],
};

export function assertValidMatchPhaseTransition(from: string, to: string): void {
  if (!isMatchPhaseValue(from) || !isMatchPhaseValue(to)) {
    throw new BadRequestError(`Unsupported match phase transition: ${from} -> ${to}`);
  }

  if (from === to) {
    throw new BadRequestError(`Same-state match transition is not allowed: ${from} -> ${to}`);
  }

  if (!MATCH_PHASE_TRANSITIONS[from].includes(to)) {
    throw new BadRequestError(`Illegal match phase transition: ${from} -> ${to}`);
  }
}
