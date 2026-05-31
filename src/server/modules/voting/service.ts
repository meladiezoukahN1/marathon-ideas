import { prisma } from "@/lib/prisma"
import { getRedisOrThrow } from "@/lib/redis"
import crypto from "crypto"

const VOTE_LUA = `
local locked = redis.call('SET', KEYS[1], '1', 'NX', 'EX', tonumber(ARGV[1]))
if not locked then return 0 end
redis.call('INCR', KEYS[2])
return 1
`

function voteTtlSeconds(votingEndsAt: Date): number {
  const remainingVotingWindow = Math.ceil((votingEndsAt.getTime() - Date.now()) / 1000)
  return Math.max(3600, remainingVotingWindow + 3600)
}

function hashFingerprint(fp: string, challengeId: string): string {
  return crypto.createHash("sha256").update(`${fp}:${challengeId}:vote-salt`).digest("hex")
}

function isVotingClosed(votingEndsAt: Date | null): boolean {
  if (!votingEndsAt) return true
  return Date.now() >= votingEndsAt.getTime()
}

// ─── Redis key builders ─────────────────────────────────────────────────────

function pubDuplicateKey(challengeId: string, sessionId: string, voterTokenHash: string): string {
  return `vote:public:${challengeId}:${sessionId}:${voterTokenHash}`
}

function pubCounterKey(challengeId: string, sessionId: string, teamId: string): string {
  return `votes:public:${challengeId}:${sessionId}:${teamId}`
}

function juryDuplicateKey(challengeId: string, sessionId: string, jurorId: string): string {
  return `vote:jury:${challengeId}:${sessionId}:${jurorId}`
}

function juryCounterKey(challengeId: string, sessionId: string, teamId: string): string {
  return `votes:jury:${challengeId}:${sessionId}:${teamId}`
}

// ─── Public vote ────────────────────────────────────────────────────────────

export async function submitPublicVote(
  challengeId: string,
  teamId: string,
  voterToken: string,
) {
  const redis = getRedisOrThrow()

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingStartedAt: true },
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

  const sessionId = challenge.votingStartedAt.toISOString()
  const hashedFp = hashFingerprint(voterToken, challengeId)
  const dupKey = pubDuplicateKey(challengeId, sessionId, hashedFp)
  const counterKey = pubCounterKey(challengeId, sessionId, teamId)
  const ttl = voteTtlSeconds(challenge.votingEndsAt!)

  const result = await (redis.eval as unknown as (...a: [string, string[], number[]]) => Promise<number>)(VOTE_LUA, [dupKey, counterKey], [ttl])
  if (!result) {
    throw new Error("ALREADY_VOTED")
  }

  // Audit log: persist public vote record to MySQL (non-blocking; failure must not break voting flow)
  prisma.publicVote.create({
    data: {
      challengeId,
      teamId,
      voterToken: hashedFp,
      votingSessionId: sessionId,
    },
  }).catch((err: unknown) => {
    console.error("[vote audit] Failed to persist public vote record:", err)
  })
}

// ─── Jury vote ──────────────────────────────────────────────────────────────

// ─── Jury vote ──────────────────────────────────────────────────────────────

export async function submitJuryVote(
  challengeId: string,
  teamId: string,
  jurorId: string,
) {
  const redis = getRedisOrThrow()

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { phase: true, votingEndsAt: true, votingStartedAt: true },
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

  const sessionId = challenge.votingStartedAt.toISOString()
  const dupKey = juryDuplicateKey(challengeId, sessionId, jurorId)
  const counterKey = juryCounterKey(challengeId, sessionId, teamId)
  const ttl = voteTtlSeconds(challenge.votingEndsAt!)

  const result = await (redis.eval as unknown as (...a: [string, string[], number[]]) => Promise<number>)(VOTE_LUA, [dupKey, counterKey], [ttl])
  if (!result) {
    throw new Error("ALREADY_VOTED")
  }

  // Audit log: persist jury vote record to MySQL (non-blocking; failure must not break voting flow)
  prisma.juryVote.create({
    data: {
      challengeId,
      teamId,
      jurorId,
      votingSessionId: sessionId,
    },
  }).catch((err: unknown) => {
    console.error("[vote audit] Failed to persist jury vote record:", err)
  })
}

// ─── Vote count readers (Redis → memory) ────────────────────────────────────

export interface RedisVoteCounts {
  team1Public: number
  team2Public: number
  totalPublic: number
  team1Jury: number
  team2Jury: number
  totalJury: number
}

export async function getRedisVoteCounts(challengeId: string, votingStartedAt: Date): Promise<RedisVoteCounts> {
  const redis = getRedisOrThrow()
  const sessionId = votingStartedAt.toISOString()

  const teams = await prisma.team.findMany({
    where: { challengeId },
    select: { id: true, slot: true },
  })
  const t1 = teams.find((t) => t.slot === "TEAM1")
  const t2 = teams.find((t) => t.slot === "TEAM2")

  const team1PublicKey = t1 ? pubCounterKey(challengeId, sessionId, t1.id) : null
  const team2PublicKey = t2 ? pubCounterKey(challengeId, sessionId, t2.id) : null
  const team1JuryKey = t1 ? juryCounterKey(challengeId, sessionId, t1.id) : null
  const team2JuryKey = t2 ? juryCounterKey(challengeId, sessionId, t2.id) : null

  const keys = [team1PublicKey, team2PublicKey, team1JuryKey, team2JuryKey].filter(Boolean) as string[]
  const values = keys.length > 0 ? await redis.mget<number[]>(...keys) : []

  const val = (idx: number) => (values[idx] ?? 0) as number

  const team1Public = team1PublicKey ? val(keys.indexOf(team1PublicKey)) : 0
  const team2Public = team2PublicKey ? val(keys.indexOf(team2PublicKey)) : 0
  const team1Jury = team1JuryKey ? val(keys.indexOf(team1JuryKey)) : 0
  const team2Jury = team2JuryKey ? val(keys.indexOf(team2JuryKey)) : 0

  return {
    team1Public,
    team2Public,
    totalPublic: team1Public + team2Public,
    team1Jury,
    team2Jury,
    totalJury: team1Jury + team2Jury,
  }
}

export async function getSimpleVoteCounts(challengeId: string, votingStartedAt: Date) {
  const counts = await getRedisVoteCounts(challengeId, votingStartedAt)
  return {
    challengeId,
    team1Count: counts.team1Public,
    team2Count: counts.team2Public,
    total: counts.totalPublic,
    juryCount: counts.totalJury,
  }
}

// ─── Redis key cleanup (used on reset) ──────────────────────────────────────

export async function cleanupRedisVoteKeys(challengeId: string, sessionId: string) {
  try {
    const redis = getRedisOrThrow()
    const pattern = `vote:*:${challengeId}:${sessionId}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Non-critical cleanup — old keys will TTL-expire
  }
}
