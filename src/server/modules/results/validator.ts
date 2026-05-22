import { z } from "zod";

import type {
  LiveResultRequestInput,
  ResolveTieRequestInput,
  ShowResultRequestInput,
} from "./types";

const showResultSchema = z.object({
  matchId: z.string().min(1),
});

const resolveTieSchema = z.object({
  matchId: z.string().min(1),
  winnerId: z.string().min(1),
});

const liveResultSchema = z.object({
  matchId: z.string().min(1),
});

export function validateShowResultInput(input: unknown): ShowResultRequestInput {
  return showResultSchema.parse(input);
}

export function validateResolveTieInput(input: unknown): ResolveTieRequestInput {
  return resolveTieSchema.parse(input);
}

export function validateLiveResultInput(input: unknown): LiveResultRequestInput {
  return liveResultSchema.parse(input);
}
