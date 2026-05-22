import type { MatchPhase, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { NotFoundError } from "@/server/core/errors";

import { createAuditLog } from "@/server/modules/audit/repository";

import type { MatchRecord, TimerAction } from "./types";

const matchSelect = {
  id: true,
  challengeId: true,
  team1Id: true,
  team2Id: true,
  winnerId: true,
  phase: true,
  timerSecs: true,
  timerActive: true,
  voteOpenAt: true,
  voteCloseAt: true,
  resultShownAt: true,
  updatedAt: true,
} as const;

function mapMatchRecord(row: {
  id: string;
  challengeId: string;
  team1Id: string;
  team2Id: string;
  winnerId: string | null;
  phase: MatchPhase;
  timerSecs: number;
  timerActive: boolean;
  voteOpenAt: Date | null;
  voteCloseAt: Date | null;
  resultShownAt: Date | null;
  updatedAt: Date;
}): MatchRecord {
  return {
    id: row.id,
    challengeId: row.challengeId,
    team1Id: row.team1Id,
    team2Id: row.team2Id,
    winnerId: row.winnerId,
    phase: row.phase,
    timerSecs: row.timerSecs,
    timerActive: row.timerActive,
    voteOpenAt: row.voteOpenAt,
    voteCloseAt: row.voteCloseAt,
    resultShownAt: row.resultShownAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMatchById(matchId: string): Promise<MatchRecord | null> {
  const row = await prisma.match.findUnique({
    where: { id: matchId },
    select: matchSelect,
  });

  return row ? mapMatchRecord(row) : null;
}

// Never infer fallback matches. If currentMatchId is null, return null explicitly.
export async function getCurrentMatchFromEventControl(): Promise<MatchRecord | null> {
  const eventControl = await prisma.eventControl.findFirst({
    orderBy: { createdAt: "asc" },
    select: { currentMatchId: true },
  });

  if (!eventControl?.currentMatchId) {
    return null;
  }

  return getMatchById(eventControl.currentMatchId);
}

interface UpdateMatchPhaseWithAuditInput {
  matchId: string;
  fromPhase: MatchPhase;
  toPhase: MatchPhase;
  actorId: string;
}

export async function updateMatchPhaseWithAudit(
  input: UpdateMatchPhaseWithAuditInput,
): Promise<MatchRecord> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: { phase: input.toPhase },
      select: matchSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: "PHASE_CHANGED",
        entity: "Match",
        entityId: updated.id,
        metadata: {
          fromPhase: input.fromPhase,
          toPhase: input.toPhase,
        },
      },
      tx,
    );

    return mapMatchRecord(updated);
  });
}

interface UpdateVotingStateWithAuditInput {
  matchId: string;
  fromPhase: MatchPhase;
  toPhase: MatchPhase;
  actorId: string;
  auditAction: "VOTING_OPENED" | "VOTING_CLOSED";
  voteOpenAt?: Date | null;
  voteCloseAt?: Date | null;
  timerActive?: boolean;
}

export async function updateVotingStateWithAudit(
  input: UpdateVotingStateWithAuditInput,
): Promise<MatchRecord> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: {
        phase: input.toPhase,
        ...(input.voteOpenAt !== undefined ? { voteOpenAt: input.voteOpenAt } : {}),
        ...(input.voteCloseAt !== undefined ? { voteCloseAt: input.voteCloseAt } : {}),
        ...(input.timerActive !== undefined ? { timerActive: input.timerActive } : {}),
      },
      select: matchSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: input.auditAction,
        entity: "Match",
        entityId: updated.id,
        metadata: {
          fromPhase: input.fromPhase,
          toPhase: input.toPhase,
          voteOpenAt: input.voteOpenAt ?? null,
          voteCloseAt: input.voteCloseAt ?? null,
          timerActive: input.timerActive ?? null,
        },
      },
      tx,
    );

    return mapMatchRecord(updated);
  });
}

interface ApplyTimerActionWithAuditInput {
  matchId: string;
  action: TimerAction;
  delta?: number;
  actorId: string;
}

export async function applyTimerActionWithAudit(
  input: ApplyTimerActionWithAuditInput,
): Promise<MatchRecord> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const current = await tx.match.findUnique({
      where: { id: input.matchId },
      select: matchSelect,
    });

    if (!current) {
      throw new NotFoundError(`Match not found: ${input.matchId}`);
    }

    const nextTimerSecs =
      input.action === "adjust"
        ? Math.max(0, current.timerSecs + (input.delta ?? 0))
        : input.action === "reset"
          ? 600
          : current.timerSecs;

    const nextTimerActive =
      input.action === "play"
        ? true
        : input.action === "pause" || input.action === "reset"
          ? false
          : current.timerActive;

    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: {
        timerSecs: nextTimerSecs,
        timerActive: nextTimerActive,
      },
      select: matchSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: "TIMER_CHANGED",
        entity: "Match",
        entityId: updated.id,
        metadata: {
          action: input.action,
          delta: input.delta ?? null,
          previousTimerSecs: current.timerSecs,
          nextTimerSecs,
          previousTimerActive: current.timerActive,
          nextTimerActive,
        },
      },
      tx,
    );

    return mapMatchRecord(updated);
  });
}
