import { prisma } from "@/lib/prisma"
import { emitToChallenge } from "@/lib/socket"
import { calcResult } from "@/lib/vote-calc"
import type { ChallengePublic } from "@/types/domain.types"

// ─── Select helpers ───────────────────────────────────────────────────────────
const TEAM_SELECT = {
  id: true, name: true, idea: true, members: true, imageUrl: true, slot: true,
} as const

const CHALLENGE_SELECT = {
  id: true, name: true, description: true, slug: true, order: true,
  status: true, phase: true, timerSecs: true, timerActive: true,
  voteOpenAt: true, voteCloseAt: true, votingStartedAt: true, votingEndsAt: true, votingDurationSeconds: true, votingSessionId: true, winnerId: true,
  teams: { select: TEAM_SELECT },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mapChallenge(c: {
  id: string; name: string; description: string | null; slug: string; order: number
  status: string; phase: string; timerSecs: number; timerActive: boolean
  voteOpenAt: Date | null; voteCloseAt: Date | null; votingStartedAt: Date | null; votingEndsAt: Date | null; votingDurationSeconds: number
  votingSessionId: string | null
  winnerId: string | null
  teams: { id: string; name: string; idea: string; members: string | null; imageUrl: string | null; slot: string }[]
}): ChallengePublic {
  return {
    ...c,
    status: c.status as ChallengePublic["status"],
    phase:  c.phase  as ChallengePublic["phase"],
    voteOpenAt:  c.voteOpenAt?.toISOString()  ?? null,
    voteCloseAt: c.voteCloseAt?.toISOString() ?? null,
    votingStartedAt: c.votingStartedAt?.toISOString() ?? null,
    votingEndsAt: c.votingEndsAt?.toISOString() ?? null,
    votingDurationSeconds: c.votingDurationSeconds,
    votingSessionId: c.votingSessionId,
    team1FinalScore: null,
    team2FinalScore: null,
    team1PublicPct: null,
    team2PublicPct: null,
    team1JuryPct: null,
    team2JuryPct: null,
    team1: c.teams.find(t => t.slot === "TEAM1")
      ? { ...c.teams.find(t => t.slot === "TEAM1")!, slot: "TEAM1", imageUrl: c.teams.find(t => t.slot === "TEAM1")!.imageUrl ?? null }
      : null,
    team2: c.teams.find(t => t.slot === "TEAM2")
      ? { ...c.teams.find(t => t.slot === "TEAM2")!, slot: "TEAM2", imageUrl: c.teams.find(t => t.slot === "TEAM2")!.imageUrl ?? null }
      : null,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export async function getChallengesByEvent(eventId: string): Promise<ChallengePublic[]> {
  const rows = await prisma.challenge.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    take: 20,
    select: CHALLENGE_SELECT,
  })
  return rows.map(mapChallenge)
}

export async function getChallengeById(id: string): Promise<ChallengePublic | null> {
  const row = await prisma.challenge.findUnique({ where: { id }, select: CHALLENGE_SELECT })
  return row ? mapChallenge(row) : null
}

// ─── Phase ────────────────────────────────────────────────────────────────────
export async function setPhase(
  challengeId: string,
  phase: "WAITING" | "PRESENTING" | "VOTING" | "RESULT",
): Promise<void> {
  const extra: Record<string, unknown> = {}
  if (phase === "VOTING")  extra.voteOpenAt  = new Date()
  if (phase === "RESULT")  extra.voteCloseAt = new Date()
  if (phase === "PRESENTING" || phase === "VOTING") extra.status = "ACTIVE"

  const updated = await prisma.challenge.update({
    where: { id: challengeId },
    data: { phase, ...extra },
    select: { phase: true, timerSecs: true, timerActive: true },
  })

  emitToChallenge(challengeId, "challenge:update", {
    challengeId,
    phase: updated.phase as "WAITING" | "PRESENTING" | "VOTING" | "RESULT",
    timerSecs: updated.timerSecs,
    timerActive: updated.timerActive,
  })
}

// ─── Timer ────────────────────────────────────────────────────────────────────
export async function controlTimer(
  challengeId: string,
  action: "play" | "pause" | "reset" | "adjust",
  delta?: number,
): Promise<{ timerSecs: number; timerActive: boolean }> {
  const cur = await prisma.challenge.findUniqueOrThrow({
    where: { id: challengeId },
    select: { timerSecs: true },
  })

  let timerSecs   = cur.timerSecs
  let timerActive = false

  if (action === "play")   { timerActive = true }
  else if (action === "pause")  { timerActive = false }
  else if (action === "reset")  { timerSecs = 600; timerActive = false }
  else if (action === "adjust") { timerSecs = Math.max(0, timerSecs + (delta ?? 0)) }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { timerSecs, timerActive: action === "play" ? true : timerActive },
  })

  return { timerSecs, timerActive: action === "play" ? true : timerActive }
}

// ─── Reveal result ────────────────────────────────────────────────────────────
export async function revealResult(challengeId: string): Promise<void> {
  const [juryVotes, publicVotes, teams] = await Promise.all([
    prisma.juryVote.findMany({ where: { challengeId }, select: { teamId: true } }),
    prisma.publicVote.findMany({ where: { challengeId }, select: { teamId: true } }),
    prisma.team.findMany({ where: { challengeId }, select: { id: true, name: true, slot: true } }),
  ])

  const t1 = teams.find(t => t.slot === "TEAM1")
  const t2 = teams.find(t => t.slot === "TEAM2")
  if (!t1 || !t2) throw new Error("Teams not found for challenge " + challengeId)

  const result = calcResult({
    juryForTeam1:   juryVotes.filter(v => v.teamId === t1.id).length,
    juryForTeam2:   juryVotes.filter(v => v.teamId === t2.id).length,
    publicForTeam1: publicVotes.filter(v => v.teamId === t1.id).length,
    publicForTeam2: publicVotes.filter(v => v.teamId === t2.id).length,
  })

  const winner = result.winnerId === "team1" ? t1 : t2

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { winnerId: winner.id, status: "COMPLETED", phase: "RESULT", voteCloseAt: new Date() },
  })

  emitToChallenge(challengeId, "result:reveal", {
    challengeId,
    winnerId:      winner.id,
    winnerName:    winner.name,
    winnerSlot:    winner.slot as "TEAM1" | "TEAM2",
    team1Name:     t1.name,
    team2Name:     t2.name,
    team1Final:    result.team1Final,
    team2Final:    result.team2Final,
    team1JuryPct:  result.team1JuryPct,
    team2JuryPct:  result.team2JuryPct,
    team1PublicPct: result.team1PublicPct,
    team2PublicPct: result.team2PublicPct,
  })
}

// ─── Vote counts ──────────────────────────────────────────────────────────────
export async function getVoteCounts(challengeId: string) {
  const [pub, jury, teams] = await Promise.all([
    prisma.publicVote.groupBy({ by: ["teamId"], where: { challengeId }, _count: { teamId: true } }),
    prisma.juryVote.findMany({ where: { challengeId }, select: { teamId: true } }),
    prisma.team.findMany({ where: { challengeId }, select: { id: true, slot: true } }),
  ])
  const t1 = teams.find(t => t.slot === "TEAM1")
  const t2 = teams.find(t => t.slot === "TEAM2")
  const team1Count = pub.find(p => p.teamId === t1?.id)?._count.teamId ?? 0
  const team2Count = pub.find(p => p.teamId === t2?.id)?._count.teamId ?? 0
  return { challengeId, team1Count, team2Count, total: team1Count + team2Count, juryCount: jury.length }
}
