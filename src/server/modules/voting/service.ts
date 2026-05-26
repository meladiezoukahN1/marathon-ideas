import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function hashFingerprint(fp: string, challengeId: string): string {
  return crypto.createHash("sha256").update(`${fp}:${challengeId}:vote-salt`).digest("hex")
}

function isVotingClosed(votingEndsAt: Date | null): boolean {
  if (!votingEndsAt) return true
  return Date.now() >= votingEndsAt.getTime()
}

export async function submitPublicVote(
  challengeId: string,
  teamId: string,
  voterToken: string,
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingSessionId: true },
  })
  if (!challenge || challenge.phase !== "VOTING") {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (isVotingClosed(challenge.votingEndsAt)) {
    throw new Error("VOTING_CLOSED")
  }
  if (!challenge.votingSessionId) {
    throw new Error("VOTING_NOT_OPEN")
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, challengeId },
    select: { id: true },
  })
  if (!team) {
    throw new Error("INVALID_TEAM")
  }

  const hashedFp = hashFingerprint(voterToken, challengeId)

  const existing = await prisma.publicVote.findUnique({
    where: {
      challengeId_votingSessionId_voterToken: {
        challengeId,
        votingSessionId: challenge.votingSessionId,
        voterToken: hashedFp,
      },
    },
  })
  if (existing) {
    throw new Error("ALREADY_VOTED")
  }

  await prisma.publicVote.create({
    data: {
      challengeId,
      teamId,
      voterToken: hashedFp,
      votingSessionId: challenge.votingSessionId,
    },
  })
}

export async function submitJuryVote(
  challengeId: string,
  teamId: string,
  jurorId: string,
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingSessionId: true },
  })
  if (!challenge || challenge.phase !== "VOTING") {
    throw new Error("VOTING_NOT_OPEN")
  }
  if (isVotingClosed(challenge.votingEndsAt)) {
    throw new Error("VOTING_CLOSED")
  }
  if (!challenge.votingSessionId) {
    throw new Error("VOTING_NOT_OPEN")
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, challengeId },
    select: { id: true },
  })
  if (!team) {
    throw new Error("INVALID_TEAM")
  }

  const existing = await prisma.juryVote.findUnique({
    where: {
      challengeId_votingSessionId_jurorId: {
        challengeId,
        votingSessionId: challenge.votingSessionId,
        jurorId,
      },
    },
  })
  if (existing) {
    throw new Error("ALREADY_VOTED")
  }

  await prisma.juryVote.create({
    data: {
      challengeId,
      teamId,
      jurorId,
      votingSessionId: challenge.votingSessionId,
    },
  })
}
