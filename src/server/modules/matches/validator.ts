import { z } from "zod"

export const teamSlotSchema = z.enum(["TEAM1", "TEAM2"])

export const timerActionSchema = z.enum(["start", "pause", "reset"])

export const patchTimerSchema = z.object({
  remainingSeconds: z.number().int().min(0).optional(),
  deltaSeconds: z.number().int().optional(),
}).refine(
  (data) => data.remainingSeconds !== undefined || data.deltaSeconds !== undefined,
  { message: "Must provide remainingSeconds or deltaSeconds" },
)

export const activateMatchSchema = z.object({
  matchId: z.string().cuid(),
})

export const changePhaseSchema = z.object({
  phase: z.enum(["WAITING", "PRESENTING", "VOTING", "RESULT", "FINISHED"]),
  votingDurationSeconds: z.number().int().min(10).optional(),
})
