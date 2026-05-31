import { prisma } from "@/lib/prisma"
import { cleanupRedisVoteKeys } from "@/server/modules/voting/service"
import type { TimerStatus, TeamSlot } from "./types"

const TIMER_FIELDS = {
  team1TimerDurationSeconds: true,
  team1TimerRemainingSeconds: true,
  team1TimerStatus: true,
  team1TimerStartedAt: true,
  team1TimerPausedAt: true,
  team2TimerDurationSeconds: true,
  team2TimerRemainingSeconds: true,
  team2TimerStatus: true,
  team2TimerStartedAt: true,
  team2TimerPausedAt: true,
} as const

const MATCH_SELECT = {
  id: true,
  name: true,
  order: true,
  status: true,
  phase: true,
  winnerId: true,
  voteOpenAt: true,
  voteCloseAt: true,
  votingStartedAt: true,
  votingEndsAt: true,
  votingDurationSeconds: true,
  votingSessionId: true,
  votingTimerStatus: true,
  votingTimerPausedAt: true,
  team1FinalScore: true,
  team2FinalScore: true,
  team1PublicPct: true,
  team2PublicPct: true,
  team1JuryPct: true,
  team2JuryPct: true,
  teams: { select: { id: true, name: true, imageUrl: true, slot: true } },
  ...TIMER_FIELDS,
  updatedAt: true,
} as const

function mapTimer(
  match: {
    id: string
    team1TimerDurationSeconds: number
    team1TimerRemainingSeconds: number
    team1TimerStatus: string
    team1TimerStartedAt: Date | null
    team1TimerPausedAt: Date | null
    team2TimerDurationSeconds: number
    team2TimerRemainingSeconds: number
    team2TimerStatus: string
    team2TimerStartedAt: Date | null
    team2TimerPausedAt: Date | null
    updatedAt: Date
  },
  slot: TeamSlot,
) {
  const prefix = slot === "TEAM1" ? "team1" : "team2"
  return {
    matchId: match.id,
    teamSlot: slot,
    durationSeconds: match[`${prefix}TimerDurationSeconds` as const],
    remainingSeconds: match[`${prefix}TimerRemainingSeconds` as const],
    status: match[`${prefix}TimerStatus` as const] as TimerStatus,
    startedAt: match[`${prefix}TimerStartedAt` as const]?.toISOString() ?? null,
    pausedAt: match[`${prefix}TimerPausedAt` as const]?.toISOString() ?? null,
    updatedAt: match.updatedAt.toISOString(),
  }
}

function maskToken(token: string): string {
  if (token.length <= 10) return token.slice(0, 3) + "..."
  return token.slice(0, 6) + "..." + token.slice(-4)
}

export async function getMatchVoteAudit(
  matchId: string,
  options: {
    teamId?: string
    voteType?: "PUBLIC" | "JURY" | "ALL"
    search?: string
    page: number
    pageSize: number
  },
) {
  const { teamId, voteType = "ALL", search, page, pageSize } = options
  const skip = (page - 1) * pageSize

  const baseWhere: Record<string, unknown> = { challengeId: matchId }
  if (teamId) baseWhere.teamId = teamId

  if (voteType === "PUBLIC") {
    const where = { ...baseWhere }
    const [rows, total] = await Promise.all([
      prisma.publicVote.findMany({
        where,
        select: { id: true, challengeId: true, teamId: true, voterToken: true, votingSessionId: true, createdAt: true, team: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.publicVote.count({ where }),
    ])
    return {
      data: rows.map((r) => ({
        id: r.id,
        matchId: r.challengeId,
        teamId: r.teamId,
        teamName: r.team.name,
        voterIdentifier: maskToken(r.voterToken),
        votingSessionId: r.votingSessionId,
        voteType: "PUBLIC" as const,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  const juryWhere: Record<string, unknown> = { ...baseWhere }
  if (search) {
    juryWhere.juror = { username: { contains: search } }
  }

  if (voteType === "JURY") {
    const [rows, total] = await Promise.all([
      prisma.juryVote.findMany({
        where: juryWhere,
        select: { id: true, challengeId: true, teamId: true, jurorId: true, votingSessionId: true, createdAt: true, team: { select: { name: true } }, juror: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.juryVote.count({ where: juryWhere }),
    ])
    return {
      data: rows.map((r) => ({
        id: r.id,
        matchId: r.challengeId,
        teamId: r.teamId,
        teamName: r.team.name,
        voterIdentifier: r.juror.username,
        votingSessionId: r.votingSessionId,
        voteType: "JURY" as const,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  // ALL: merge both vote types, sorted by createdAt desc, then paginate
  const OVERFETCH_LIMIT = 5000
  const [publicRows, juryRows, publicTotal, juryTotal] = await Promise.all([
    prisma.publicVote.findMany({
      where: baseWhere,
      select: { id: true, challengeId: true, teamId: true, voterToken: true, votingSessionId: true, createdAt: true, team: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: OVERFETCH_LIMIT,
    }),
    prisma.juryVote.findMany({
      where: juryWhere,
      select: { id: true, challengeId: true, teamId: true, jurorId: true, votingSessionId: true, createdAt: true, team: { select: { name: true } }, juror: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: OVERFETCH_LIMIT,
    }),
    prisma.publicVote.count({ where: baseWhere }),
    prisma.juryVote.count({ where: juryWhere }),
  ])

  const total = publicTotal + juryTotal
  const merged: Array<{
    id: string
    challengeId: string
    teamId: string
    teamName: string
    voterIdentifier: string
    votingSessionId: string | null
    voteType: "PUBLIC" | "JURY"
    createdAt: Date
  }> = [
    ...publicRows.map((r) => ({
      id: r.id,
      challengeId: r.challengeId,
      teamId: r.teamId,
      teamName: r.team.name,
      voterIdentifier: maskToken(r.voterToken),
      votingSessionId: r.votingSessionId,
      voteType: "PUBLIC" as const,
      createdAt: r.createdAt,
    })),
    ...juryRows.map((r) => ({
      id: r.id,
      challengeId: r.challengeId,
      teamId: r.teamId,
      teamName: r.team.name,
      voterIdentifier: r.juror.username,
      votingSessionId: r.votingSessionId,
      voteType: "JURY" as const,
      createdAt: r.createdAt,
    })),
  ]

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const paged = merged.slice(skip, skip + pageSize)

  return {
    data: paged.map((r) => ({
      id: r.id,
      matchId: r.challengeId,
      teamId: r.teamId,
      teamName: r.teamName,
      voterIdentifier: r.voterIdentifier,
      votingSessionId: r.votingSessionId,
      voteType: r.voteType,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

export async function getMatchesForAdmin(eventId: string) {
  const rows = await prisma.challenge.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    select: MATCH_SELECT,
  })

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    order: r.order,
    status: r.status,
    phase: r.phase,
    winnerId: r.winnerId,
    voteOpenAt: r.voteOpenAt?.toISOString() ?? null,
    voteCloseAt: r.voteCloseAt?.toISOString() ?? null,
    votingStartedAt: r.votingStartedAt?.toISOString() ?? null,
    votingEndsAt: r.votingEndsAt?.toISOString() ?? null,
    votingDurationSeconds: r.votingDurationSeconds,
    votingTimerStatus: r.votingTimerStatus,
    votingTimerPausedAt: r.votingTimerPausedAt?.toISOString() ?? null,
    team1FinalScore: r.team1FinalScore,
    team2FinalScore: r.team2FinalScore,
    team1PublicPct: r.team1PublicPct,
    team2PublicPct: r.team2PublicPct,
    team1JuryPct: r.team1JuryPct,
    team2JuryPct: r.team2JuryPct,
    team1: r.teams.find((t) => t.slot === "TEAM1") ?? null,
    team2: r.teams.find((t) => t.slot === "TEAM2") ?? null,
    team1Timer: mapTimer(r, "TEAM1"),
    team2Timer: mapTimer(r, "TEAM2"),
  }))
}

export async function getMatchById(matchId: string) {
  const row = await prisma.challenge.findUnique({
    where: { id: matchId },
    select: MATCH_SELECT,
  })
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    status: row.status,
    phase: row.phase,
    winnerId: row.winnerId,
    voteOpenAt: row.voteOpenAt?.toISOString() ?? null,
    voteCloseAt: row.voteCloseAt?.toISOString() ?? null,
    votingStartedAt: row.votingStartedAt?.toISOString() ?? null,
    votingEndsAt: row.votingEndsAt?.toISOString() ?? null,
    votingDurationSeconds: row.votingDurationSeconds,
    votingSessionId: row.votingSessionId,
    votingTimerStatus: row.votingTimerStatus,
    votingTimerPausedAt: row.votingTimerPausedAt?.toISOString() ?? null,
    team1FinalScore: row.team1FinalScore,
    team2FinalScore: row.team2FinalScore,
    team1PublicPct: row.team1PublicPct,
    team2PublicPct: row.team2PublicPct,
    team1JuryPct: row.team1JuryPct,
    team2JuryPct: row.team2JuryPct,
    team1: row.teams.find((t) => t.slot === "TEAM1") ?? null,
    team2: row.teams.find((t) => t.slot === "TEAM2") ?? null,
    team1Timer: mapTimer(row, "TEAM1"),
    team2Timer: mapTimer(row, "TEAM2"),
  }
}

export async function getActiveMatch(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { activeChallengeId: true },
  })
  if (!event?.activeChallengeId) return null
  return getMatchById(event.activeChallengeId)
}

export async function setActiveMatch(eventId: string, matchId: string | null) {
  await prisma.event.update({
    where: { id: eventId },
    data: { activeChallengeId: matchId },
  })
}

export async function updateTimerState(
  matchId: string,
  slot: TeamSlot,
  data: {
    remainingSeconds?: number
    status?: TimerStatus
    startedAt?: Date | null
    pausedAt?: Date | null
  },
) {
  const prefix = slot === "TEAM1" ? "team1" : "team2"
  const updateData: Record<string, unknown> = {}
  if (data.remainingSeconds !== undefined) {
    updateData[`${prefix}TimerRemainingSeconds`] = data.remainingSeconds
  }
  if (data.status !== undefined) {
    updateData[`${prefix}TimerStatus`] = data.status
  }
  if (data.startedAt !== undefined) {
    updateData[`${prefix}TimerStartedAt`] = data.startedAt
  }
  if (data.pausedAt !== undefined) {
    updateData[`${prefix}TimerPausedAt`] = data.pausedAt
  }

  await prisma.challenge.update({
    where: { id: matchId },
    data: updateData,
  })
}

export async function resetTimerState(
  matchId: string,
  slot: TeamSlot,
) {
  const prefix = slot === "TEAM1" ? "team1" : "team2"
  const challenge = await prisma.challenge.findUnique({
    where: { id: matchId },
    select: { team1TimerDurationSeconds: true, team2TimerDurationSeconds: true },
  })
  if (!challenge) return

  const duration = prefix === "team1" ? challenge.team1TimerDurationSeconds : challenge.team2TimerDurationSeconds

  await prisma.challenge.update({
    where: { id: matchId },
    data: {
      [`${prefix}TimerRemainingSeconds`]: duration,
      [`${prefix}TimerStatus`]: "READY",
      [`${prefix}TimerStartedAt`]: null,
      [`${prefix}TimerPausedAt`]: null,
    },
  })
}

export async function declareWinner(matchId: string, winnerId: string) {
  await prisma.challenge.update({
    where: { id: matchId },
    data: {
      winnerId,
      status: "COMPLETED",
      phase: "RESULT",
      voteCloseAt: new Date(),
    },
  })
}

export async function updateChallengePhase(
  matchId: string,
  phase: string,
  extra: Record<string, unknown> = {},
) {
  await prisma.challenge.update({
    where: { id: matchId },
    data: { phase: phase as "WAITING" | "PRESENTING" | "VOTING" | "RESULT" | "FINISHED", ...extra },
  })
}

export async function getVoteCounts(matchId: string) {
  const [pub, jury, teams] = await Promise.all([
    prisma.publicVote.groupBy({ by: ["teamId"], where: { challengeId: matchId }, _count: { teamId: true } }),
    prisma.juryVote.findMany({ where: { challengeId: matchId }, select: { teamId: true } }),
    prisma.team.findMany({ where: { challengeId: matchId }, select: { id: true, slot: true } }),
  ])
  const t1 = teams.find((t) => t.slot === "TEAM1")
  const t2 = teams.find((t) => t.slot === "TEAM2")
  const team1Public = pub.find((p) => p.teamId === t1?.id)?._count.teamId ?? 0
  const team2Public = pub.find((p) => p.teamId === t2?.id)?._count.teamId ?? 0
  const team1Jury = jury.filter((v) => v.teamId === t1?.id).length
  const team2Jury = jury.filter((v) => v.teamId === t2?.id).length
  return {
    team1Public,
    team2Public,
    totalPublic: team1Public + team2Public,
    team1Jury,
    team2Jury,
    totalJury: team1Jury + team2Jury,
  }
}

export async function storeResult(
  matchId: string,
  result: {
    winnerId: string | null
    team1FinalScore: number
    team2FinalScore: number
    team1PublicPct: number
    team2PublicPct: number
    team1JuryPct: number
    team2JuryPct: number
  },
) {
  await prisma.challenge.update({
    where: { id: matchId },
    data: {
      winnerId: result.winnerId,
      voteCloseAt: new Date(),
      votingTimerStatus: "FINISHED",
      votingTimerPausedAt: null,
      team1FinalScore: result.team1FinalScore,
      team2FinalScore: result.team2FinalScore,
      team1PublicPct: result.team1PublicPct,
      team2PublicPct: result.team2PublicPct,
      team1JuryPct: result.team1JuryPct,
      team2JuryPct: result.team2JuryPct,
    },
  })
}

export async function getAllMatchesWithResults(eventId: string) {
  const rows = await prisma.challenge.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      status: true,
      phase: true,
      winnerId: true,
      team1FinalScore: true,
      team2FinalScore: true,
  teams: { select: { id: true, name: true, imageUrl: true, slot: true } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    order: r.order,
    status: r.status,
    phase: r.phase,
    winnerId: r.winnerId,
    team1FinalScore: r.team1FinalScore,
    team2FinalScore: r.team2FinalScore,
    team1: r.teams.find((t) => t.slot === "TEAM1") ?? null,
    team2: r.teams.find((t) => t.slot === "TEAM2") ?? null,
  }))
}

const ACTIVE_PHASES: import("@/types/domain.types").ChallengePhase[] = ["PRESENTING", "VOTING", "RESULT"]

export async function getOtherActiveChallenge(eventId: string, excludeMatchId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { activeChallengeId: true },
  })
  if (event?.activeChallengeId && event.activeChallengeId !== excludeMatchId) {
    return event.activeChallengeId
  }
  // Also check challenges in active phases
  const other = await prisma.challenge.findFirst({
    where: {
      eventId,
      id: { not: excludeMatchId },
      phase: { in: ACTIVE_PHASES },
    },
    select: { id: true },
  })
  return other?.id ?? null
}

export async function clearActiveChallengeIfMatch(eventId: string, matchId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { activeChallengeId: true },
  })
  if (event?.activeChallengeId === matchId) {
    await prisma.event.update({
      where: { id: eventId },
      data: { activeChallengeId: null },
    })
  }
}

export async function resetMatch(matchId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: matchId },
    select: {
      eventId: true,
      votingStartedAt: true,
      team1TimerDurationSeconds: true,
      team2TimerDurationSeconds: true,
    },
  })
  if (!challenge) throw new Error("MATCH_NOT_FOUND")

  // Clean up Redis keys for this challenge's current session
  if (challenge.votingStartedAt) {
    void cleanupRedisVoteKeys(matchId, challenge.votingStartedAt.toISOString())
  }

  await prisma.$transaction([
    prisma.publicVote.deleteMany({ where: { challengeId: matchId } }),
    prisma.juryVote.deleteMany({ where: { challengeId: matchId } }),
    prisma.challenge.update({
      where: { id: matchId },
      data: {
        phase: "WAITING",
        status: "PENDING",
        winnerId: null,
        voteOpenAt: null,
        voteCloseAt: null,
        votingStartedAt: null,
        votingEndsAt: null,
        votingSessionId: null,
        votingTimerStatus: "READY",
        votingTimerPausedAt: null,
        team1FinalScore: null,
        team2FinalScore: null,
        team1PublicPct: null,
        team2PublicPct: null,
        team1JuryPct: null,
        team2JuryPct: null,
        team1TimerRemainingSeconds: challenge.team1TimerDurationSeconds,
        team1TimerStatus: "READY",
        team1TimerStartedAt: null,
        team1TimerPausedAt: null,
        team2TimerRemainingSeconds: challenge.team2TimerDurationSeconds,
        team2TimerStatus: "READY",
        team2TimerStartedAt: null,
        team2TimerPausedAt: null,
      },
    }),
  ])

  await clearActiveChallengeIfMatch(challenge.eventId, matchId)
}

export async function deleteAllChallenges(eventId: string) {
  const challenges = await prisma.challenge.findMany({
    where: { eventId },
    select: { id: true },
  })
  if (challenges.length === 0) return 0

  const ids = challenges.map((c) => c.id)
  await prisma.$transaction([
    prisma.publicVote.deleteMany({ where: { challengeId: { in: ids } } }),
    prisma.juryVote.deleteMany({ where: { challengeId: { in: ids } } }),
    prisma.challenge.deleteMany({ where: { eventId } }),
    prisma.event.update({
      where: { id: eventId },
      data: { activeChallengeId: null },
    }),
  ])
  return challenges.length
}

export async function resetAllChallenges(eventId: string) {
  const challenges = await prisma.challenge.findMany({
    where: { eventId },
    select: {
      id: true,
      votingStartedAt: true,
      team1TimerDurationSeconds: true,
      team2TimerDurationSeconds: true,
    },
  })
  if (challenges.length === 0) return 0

  // Clean up Redis keys for all challenges
  for (const c of challenges) {
    if (c.votingStartedAt) {
      void cleanupRedisVoteKeys(c.id, c.votingStartedAt.toISOString())
    }
  }

  await prisma.$transaction([
    prisma.publicVote.deleteMany({ where: { challenge: { eventId } } }),
    prisma.juryVote.deleteMany({ where: { challenge: { eventId } } }),
    ...challenges.map((c) =>
      prisma.challenge.update({
        where: { id: c.id },
        data: {
          phase: "WAITING",
          status: "PENDING",
          winnerId: null,
          voteOpenAt: null,
          voteCloseAt: null,
          votingStartedAt: null,
          votingEndsAt: null,
          votingSessionId: null,
          votingTimerStatus: "READY",
          votingTimerPausedAt: null,
          team1FinalScore: null,
          team2FinalScore: null,
          team1PublicPct: null,
          team2PublicPct: null,
          team1JuryPct: null,
          team2JuryPct: null,
          team1TimerRemainingSeconds: c.team1TimerDurationSeconds,
          team1TimerStatus: "READY",
          team1TimerStartedAt: null,
          team1TimerPausedAt: null,
          team2TimerRemainingSeconds: c.team2TimerDurationSeconds,
          team2TimerStatus: "READY",
          team2TimerStartedAt: null,
          team2TimerPausedAt: null,
        },
      }),
    ),
    prisma.event.update({
      where: { id: eventId },
      data: { activeChallengeId: null },
    }),
  ])
  return challenges.length
}
