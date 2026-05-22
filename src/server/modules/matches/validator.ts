import { z } from "zod";

import type {
  CloseVotingRequestInput,
  ChangeMatchPhaseRequestInput,
  OpenVotingRequestInput,
  TimerActionRequestInput,
} from "./types";

export const MATCH_PHASE_VALUES = [
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

const changeMatchPhaseSchema = z.object({
  matchId: z.string().min(1),
  phase: z.enum(MATCH_PHASE_VALUES),
});

const votingControlSchema = z.object({
  matchId: z.string().min(1),
});

const timerActionSchema = z
  .object({
    matchId: z.string().min(1),
    action: z.enum(["play", "pause", "reset", "adjust"]),
    delta: z.number().int().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "adjust") {
      if (typeof value.delta !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delta"],
          message: "delta is required when action is adjust",
        });
      }
      return;
    }

    if (typeof value.delta !== "undefined") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delta"],
        message: "delta is allowed only when action is adjust",
      });
    }
  });

export function validateChangeMatchPhaseInput(input: unknown): ChangeMatchPhaseRequestInput {
  return changeMatchPhaseSchema.parse(input);
}

export function validateOpenVotingInput(input: unknown): OpenVotingRequestInput {
  return votingControlSchema.parse(input);
}

export function validateCloseVotingInput(input: unknown): CloseVotingRequestInput {
  return votingControlSchema.parse(input);
}

export function validateTimerActionInput(input: unknown): TimerActionRequestInput {
  return timerActionSchema.parse(input);
}
