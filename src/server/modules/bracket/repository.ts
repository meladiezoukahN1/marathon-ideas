import { prisma } from "@/lib/prisma/client";

import type {
  BracketChallengeWithMatchRow,
  BracketEventControlSnapshot,
  BracketRepositorySnapshot,
  VoteCountRow,
} from "./types";

async function getEventControlSnapshot(): Promise<BracketEventControlSnapshot | null> {
  const eventControl = await prisma.eventControl.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      displayMode: true,
      currentMatchId: true,
    },
  });

  if (!eventControl) {
    return null;
  }

  return {
    displayMode: eventControl.displayMode,
    currentMatchId: eventControl.currentMatchId,
  };
}

async function getChallengesWithMatches(): Promise<BracketChallengeWithMatchRow[]> {
  return prisma.challenge.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      order: true,
      match: {
        select: {
          id: true,
          challengeId: true,
          phase: true,
          resultStatus: true,
          timerSecs: true,
          timerActive: true,
          voteOpenAt: true,
          voteCloseAt: true,
          resultShownAt: true,
          team1: {
            select: {
              id: true,
              nameAr: true,
              ideaAr: true,
            },
          },
          team2: {
            select: {
              id: true,
              nameAr: true,
              ideaAr: true,
            },
          },
          winner: {
            select: {
              id: true,
              nameAr: true,
              ideaAr: true,
            },
          },
        },
      },
    },
  });
}

async function getPublicVoteCounts(matchIds: string[]): Promise<VoteCountRow[]> {
  if (matchIds.length === 0) {
    return [];
  }

  const rows = await prisma.publicVote.groupBy({
    by: ["matchId", "teamId"],
    where: { matchId: { in: matchIds } },
    _count: { _all: true },
  });

  return rows.map((row) => ({
    matchId: row.matchId,
    teamId: row.teamId,
    count: row._count._all,
  }));
}

async function getJuryVoteCounts(matchIds: string[]): Promise<VoteCountRow[]> {
  if (matchIds.length === 0) {
    return [];
  }

  const rows = await prisma.juryVote.groupBy({
    by: ["matchId", "teamId"],
    where: { matchId: { in: matchIds } },
    _count: { _all: true },
  });

  return rows.map((row) => ({
    matchId: row.matchId,
    teamId: row.teamId,
    count: row._count._all,
  }));
}

export async function getBracketRepositorySnapshot(): Promise<BracketRepositorySnapshot> {
  const [eventControl, challenges] = await Promise.all([
    getEventControlSnapshot(),
    getChallengesWithMatches(),
  ]);

  const matchIds = challenges
    .map((challenge) => challenge.match?.id ?? null)
    .filter((matchId): matchId is string => Boolean(matchId));

  const [publicVoteCounts, juryVoteCounts] = await Promise.all([
    getPublicVoteCounts(matchIds),
    getJuryVoteCounts(matchIds),
  ]);

  return {
    eventControl,
    challenges,
    publicVoteCounts,
    juryVoteCounts,
  };
}
