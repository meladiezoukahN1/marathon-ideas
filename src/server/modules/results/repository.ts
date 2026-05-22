import type { Prisma } from "@prisma/client";

import { prisma } from "../../../lib/prisma/client";

import { createAuditLog } from "../audit/repository";

import type {
  LiveResultSnapshot,
  MatchVoteTotals,
  ResultMatchSnapshot,
  ResultMutationResult,
  ResultStatusValue,
} from "./types";

const resultMatchSelect = {
  id: true,
  phase: true,
  team1Id: true,
  team2Id: true,
  resultStatus: true,
} as const;

const liveResultSelect = {
  id: true,
  phase: true,
  resultStatus: true,
  winnerId: true,
  team1Final: true,
  team2Final: true,
  resultShownAt: true,
} as const;

const resultMutationSelect = {
  id: true,
  resultStatus: true,
  winnerId: true,
  team1Final: true,
  team2Final: true,
  resultShownAt: true,
} as const;

function mapResultMatchSnapshot(row: {
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
  resultStatus: "NOT_CALCULATED" | "CALCULATED" | "TIE_PENDING" | "TIE_RESOLVED";
}): ResultMatchSnapshot {
  return {
    id: row.id,
    phase: row.phase,
    team1Id: row.team1Id,
    team2Id: row.team2Id,
    resultStatus: row.resultStatus,
  };
}

function mapResultMutationResult(row: {
  id: string;
  resultStatus: "NOT_CALCULATED" | "CALCULATED" | "TIE_PENDING" | "TIE_RESOLVED";
  winnerId: string | null;
  team1Final: number | null;
  team2Final: number | null;
  resultShownAt: Date | null;
}): ResultMutationResult {
  return {
    id: row.id,
    resultStatus: row.resultStatus,
    winnerId: row.winnerId,
    team1Final: row.team1Final,
    team2Final: row.team2Final,
    resultShownAt: row.resultShownAt,
  };
}

function mapLiveResultSnapshot(row: {
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
  resultStatus: "NOT_CALCULATED" | "CALCULATED" | "TIE_PENDING" | "TIE_RESOLVED";
  winnerId: string | null;
  team1Final: number | null;
  team2Final: number | null;
  resultShownAt: Date | null;
}): LiveResultSnapshot {
  return {
    id: row.id,
    phase: row.phase,
    resultStatus: row.resultStatus,
    winnerId: row.winnerId,
    team1Final: row.team1Final,
    team2Final: row.team2Final,
    resultShownAt: row.resultShownAt,
  };
}

function toCountMap(rows: Array<{ teamId: string; _count: { _all: number } }>): Map<string, number> {
  return new Map(rows.map((row) => [row.teamId, row._count._all]));
}

export async function getResultMatchById(matchId: string): Promise<ResultMatchSnapshot | null> {
  const row = await prisma.match.findUnique({
    where: { id: matchId },
    select: resultMatchSelect,
  });

  return row ? mapResultMatchSnapshot(row) : null;
}

export async function getLiveResultMatchById(matchId: string): Promise<LiveResultSnapshot | null> {
  const row = await prisma.match.findUnique({
    where: { id: matchId },
    select: liveResultSelect,
  });

  return row ? mapLiveResultSnapshot(row) : null;
}

export async function getMatchVoteTotals(match: {
  id: string;
  team1Id: string;
  team2Id: string;
}): Promise<MatchVoteTotals> {
  const [activeJuryCount, juryRows, publicRows] = await Promise.all([
    prisma.user.count({
      where: {
        role: "JURY",
        isActive: true,
      },
    }),
    prisma.juryVote.groupBy({
      by: ["teamId"],
      where: { matchId: match.id },
      _count: { _all: true },
    }),
    prisma.publicVote.groupBy({
      by: ["teamId"],
      where: { matchId: match.id },
      _count: { _all: true },
    }),
  ]);

  const juryMap = toCountMap(juryRows);
  const publicMap = toCountMap(publicRows);

  return {
    activeJuryCount,
    juryVotesTeam1: juryMap.get(match.team1Id) ?? 0,
    juryVotesTeam2: juryMap.get(match.team2Id) ?? 0,
    publicVotesTeam1: publicMap.get(match.team1Id) ?? 0,
    publicVotesTeam2: publicMap.get(match.team2Id) ?? 0,
  };
}

interface SaveCalculatedResultWithAuditInput {
  matchId: string;
  actorId: string;
  team1Final: number;
  team2Final: number;
  winnerId: string | null;
  resultStatus: ResultStatusValue;
}

export async function saveCalculatedResultWithAudit(
  input: SaveCalculatedResultWithAuditInput,
): Promise<ResultMutationResult> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const now = new Date();

    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: {
        team1Final: input.team1Final,
        team2Final: input.team2Final,
        winnerId: input.winnerId,
        resultStatus: input.resultStatus,
        resultShownAt: now,
      },
      select: resultMutationSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: "RESULT_CALCULATED",
        entity: "Match",
        entityId: updated.id,
        metadata: {
          resultStatus: input.resultStatus,
          winnerId: input.winnerId,
          team1Final: input.team1Final,
          team2Final: input.team2Final,
        },
      },
      tx,
    );

    return mapResultMutationResult(updated);
  });
}

interface ResolveTieWithAuditInput {
  matchId: string;
  actorId: string;
  winnerId: string;
}

export async function resolveTieWithAudit(
  input: ResolveTieWithAuditInput,
): Promise<ResultMutationResult> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: {
        winnerId: input.winnerId,
        resultStatus: "TIE_RESOLVED",
      },
      select: resultMutationSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: "TIE_RESOLVED",
        entity: "Match",
        entityId: updated.id,
        metadata: {
          winnerId: input.winnerId,
        },
      },
      tx,
    );

    return mapResultMutationResult(updated);
  });
}
