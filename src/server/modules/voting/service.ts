import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function hashFingerprint(fp: string, challengeId: string): string {
  return crypto.createHash("sha256").update(`${fp}:${challengeId}:vote-salt`).digest("hex")
}

function isVotingClosed(votingEndsAt: Date | null): boolean {
  if (!votingEndsAt) return true
  return Date.now() >= votingEndsAt.getTime()
}

// ─── Public vote ────────────────────────────────────────────────────────────

export async function submitPublicVote(
  challengeId: string,
  teamId: string,
  voterToken: string,
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingStartedAt: true, votingSessionId: true },
  })
  if (!challenge || challenge.phase !== "VOTING") {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (!challenge.votingStartedAt) {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (isVotingClosed(challenge.votingEndsAt)) {
    throw new Error("VOTING_CLOSED")
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, challengeId },
    select: { id: true },
  })
  if (!team) {
    throw new Error("INVALID_TEAM")
  }

  const sessionId = challenge.votingSessionId ?? challenge.votingStartedAt.toISOString()
  const hashedFp = hashFingerprint(voterToken, challengeId)

  try {
    await prisma.publicVote.create({
      data: {
        challengeId,
        teamId,
        voterToken: hashedFp,
        votingSessionId: sessionId,
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as Record<string, unknown>).code === "P2002") {
      throw new Error("ALREADY_VOTED")
    }
    throw err
  }
}

// ─── Jury vote ──────────────────────────────────────────────────────────────

export async function submitJuryVote(
  challengeId: string,
  teamId: string,
  jurorId: string,
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingStartedAt: true, votingSessionId: true },
  })
  if (!challenge || challenge.phase !== "VOTING") {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (!challenge.votingStartedAt) {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (isVotingClosed(challenge.votingEndsAt)) {
    throw new Error("VOTING_CLOSED")
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, challengeId },
    select: { id: true },
  })
  if (!team) {
    throw new Error("INVALID_TEAM")
  }

  const sessionId = challenge.votingSessionId ?? challenge.votingStartedAt.toISOString()

  try {
    await prisma.juryVote.create({
      data: {
        challengeId,
        teamId,
        jurorId,
        votingSessionId: sessionId,
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as Record<string, unknown>).code === "P2002") {
      throw new Error("ALREADY_VOTED")
    }
    throw err
  }
}

// ─── Vote count readers (MySQL) ─────────────────────────────────────────────

export interface VoteCounts {
  team1Public: number
  team2Public: number
  totalPublic: number
  team1Jury: number
  team2Jury: number
  totalJury: number
}

export async function getVoteCounts(challengeId: string, votingSessionId: string): Promise<VoteCounts> {
  const sessionId = votingSessionId

  const [pubGroup, juryGroup, teams] = await Promise.all([
    prisma.publicVote.groupBy({
      by: ["teamId"],
      where: { challengeId, votingSessionId: sessionId },
      _count: { teamId: true },
    }),
    prisma.juryVote.groupBy({
      by: ["teamId"],
      where: { challengeId, votingSessionId: sessionId },
      _count: { teamId: true },
    }),
    prisma.team.findMany({
      where: { challengeId },
      select: { id: true, slot: true },
    }),
  ])

  const t1 = teams.find((t) => t.slot === "TEAM1")
  const t2 = teams.find((t) => t.slot === "TEAM2")

  const team1Public = pubGroup.find((p) => p.teamId === t1?.id)?._count.teamId ?? 0
  const team2Public = pubGroup.find((p) => p.teamId === t2?.id)?._count.teamId ?? 0
  const team1Jury = juryGroup.find((p) => p.teamId === t1?.id)?._count.teamId ?? 0
  const team2Jury = juryGroup.find((p) => p.teamId === t2?.id)?._count.teamId ?? 0

  return {
    team1Public,
    team2Public,
    totalPublic: team1Public + team2Public,
    team1Jury,
    team2Jury,
    totalJury: team1Jury + team2Jury,
  }
}
