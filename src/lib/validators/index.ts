import { z } from "zod"

export const publicVoteSchema = z.object({
  challengeId: z.string().cuid(),
  teamId:      z.string().cuid(),
  voterToken:  z.string().min(6).max(80),
})

export const juryVoteSchema = z.object({
  challengeId: z.string().cuid(),
  teamId:      z.string().cuid(),
})

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action:      z.literal("setPhase"),
    challengeId: z.string().cuid(),
    phase:       z.enum(["WAITING", "PRESENTING", "VOTING", "RESULT"]),
  }),
  z.object({
    action:      z.literal("timerControl"),
    challengeId: z.string().cuid(),
    timerAction: z.enum(["play", "pause", "reset", "adjust"]),
    delta:       z.number().optional(),
  }),
  z.object({
    action:      z.literal("revealResult"),
    challengeId: z.string().cuid(),
  }),
])

export const createUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
  role:     z.enum(["ADMIN", "JURY"]),
  eventId:  z.string().cuid(),
})

export const createTeamSchema = z.object({
  challengeId: z.string().cuid(),
  name:        z.string().min(2).max(100),
  idea:        z.string().min(10).max(1000),
  members:     z.string().max(500).optional(),
  slot:        z.enum(["TEAM1", "TEAM2"]),
  imageUrl:    z.string().url().max(500).optional(),
})

export const updateTeamSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  idea:     z.string().min(10).max(1000).optional(),
  members:  z.string().max(500).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
})

export const createChallengeSchema = z.object({
  eventId:     z.string().cuid(),
  name:        z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  slug:        z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  order:       z.number().int().min(1).max(99),
})

export const updateChallengeSchema = z.object({
  name:        z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
})
