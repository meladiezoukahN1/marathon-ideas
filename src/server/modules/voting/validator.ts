import { z } from "zod";

import type {
  GetCurrentJuryVotingStateRequestInput,
  GetCurrentPublicVotingStateRequestInput,
  JuryVoteRequestInput,
  PublicVoteRequestInput,
} from "./types";

const publicVoteSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1),
  fingerprintHash: z.string().min(1).max(256),
});

const juryVoteSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1),
});

const emptyRequestSchema = z.object({}).strict();

export function validatePublicVoteInput(input: unknown): PublicVoteRequestInput {
  return publicVoteSchema.parse(input);
}

export function validateJuryVoteInput(input: unknown): JuryVoteRequestInput {
  return juryVoteSchema.parse(input);
}

export function validateGetCurrentPublicVotingStateInput(
  input: unknown,
): GetCurrentPublicVotingStateRequestInput {
  return emptyRequestSchema.parse(input);
}

export function validateGetCurrentJuryVotingStateInput(
  input: unknown,
): GetCurrentJuryVotingStateRequestInput {
  return emptyRequestSchema.parse(input);
}
