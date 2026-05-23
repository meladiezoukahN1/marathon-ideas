import { prisma } from "../../../lib/prisma/client";
import { getCurrentMatchFromEventControl } from "../matches/repository";

import type {
  DuplicateVoteResult,
  VoteInsertResult,
  VotingMatchSnapshot,
} from "./types";

const votingMatchSelect = {
  id: true,
  phase: true,
  team1Id: true,
  team2Id: true,
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
} as const;

function mapVotingMatchSnapshot(row: {
  id: string;
  phase:
    | "WAITING"
    | "BRACKET_PREVIEW"
    | "PRESENTING_TEAM1"
    | "PRESENTING_TEAM2"
    | "VOTING"
    | "CLOSED"
    | "WINNER_REVEAL"
    | "BRACKET_UPDATE"
    | "RESULT";
  team1Id: string;
  team2Id: string;
  team1: {
    id: string;
    nameAr: string;
    ideaAr: string;
  };
  team2: {
    id: string;
    nameAr: string;
    ideaAr: string;
  };
}): VotingMatchSnapshot {
  return {
    id: row.id,
    phase: row.phase,
    team1Id: row.team1Id,
    team2Id: row.team2Id,
    team1: {
      id: row.team1.id,
      nameAr: row.team1.nameAr,
      ideaAr: row.team1.ideaAr,
    },
    team2: {
      id: row.team2.id,
      nameAr: row.team2.nameAr,
      ideaAr: row.team2.ideaAr,
    },
  };
}

export async function getVotingMatchById(matchId: string): Promise<VotingMatchSnapshot | null> {
  const row = await prisma.match.findUnique({
    where: { id: matchId },
    select: votingMatchSelect,
  });

  return row ? mapVotingMatchSnapshot(row) : null;
}

export async function getCurrentVotingMatchFromEventControl(): Promise<VotingMatchSnapshot | null> {
  const current = await getCurrentMatchFromEventControl();

  if (!current) {
    return null;
  }

  return getVotingMatchById(current.id);
}

export async function checkPublicVoteDuplicate(
  matchId: string,
  hashedIp: string,
  fingerprintHash: string,
): Promise<DuplicateVoteResult> {
  const [ipVote, fingerprintVote] = await Promise.all([
    prisma.publicVote.findFirst({
      where: { matchId, hashedIp },
      select: { id: true },
    }),
    prisma.publicVote.findFirst({
      where: { matchId, fingerprintHash },
      select: { id: true },
    }),
  ]);

  if (ipVote) {
    return { isDuplicate: true, reason: "IP" };
  }

  if (fingerprintVote) {
    return { isDuplicate: true, reason: "FINGERPRINT" };
  }

  return { isDuplicate: false, reason: null };
}

export async function insertPublicVote(input: {
  matchId: string;
  teamId: string;
  hashedIp: string;
  fingerprintHash: string;
}): Promise<VoteInsertResult> {
  return prisma.publicVote.create({
    data: {
      matchId: input.matchId,
      teamId: input.teamId,
      hashedIp: input.hashedIp,
      fingerprintHash: input.fingerprintHash,
    },
    select: { id: true },
  });
}

export async function hasJuryVote(matchId: string, userId: string): Promise<boolean> {
  const existing = await prisma.juryVote.findFirst({
    where: { matchId, userId },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function insertJuryVote(input: {
  matchId: string;
  teamId: string;
  userId: string;
}): Promise<VoteInsertResult> {
  return prisma.juryVote.create({
    data: {
      matchId: input.matchId,
      teamId: input.teamId,
      userId: input.userId,
    },
    select: { id: true },
  });
}
