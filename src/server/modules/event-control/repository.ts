import type { DisplayMode, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

import { createAuditLog } from "@/server/modules/audit/repository";

import type { EventControlRecord } from "./types";

const eventControlSelect = {
  id: true,
  displayMode: true,
  currentMatchId: true,
  updatedBy: true,
  updatedAt: true,
} as const;

function mapEventControlRecord(row: {
  id: string;
  displayMode: DisplayMode;
  currentMatchId: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}): EventControlRecord {
  return {
    id: row.id,
    displayMode: row.displayMode,
    currentMatchId: row.currentMatchId,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

export async function getCurrentEventControlRecord(): Promise<EventControlRecord | null> {
  const row = await prisma.eventControl.findFirst({
    orderBy: { createdAt: "asc" },
    select: eventControlSelect,
  });

  return row ? mapEventControlRecord(row) : null;
}

interface UpdateDisplayModeWithAuditInput {
  eventControlId: string;
  previousDisplayMode: DisplayMode;
  nextDisplayMode: DisplayMode;
  actorId: string;
}

export async function updateDisplayModeWithAudit(
  input: UpdateDisplayModeWithAuditInput,
): Promise<EventControlRecord> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.eventControl.update({
      where: { id: input.eventControlId },
      data: {
        displayMode: input.nextDisplayMode,
        updatedBy: input.actorId,
      },
      select: eventControlSelect,
    });

    await createAuditLog(
      {
        actorId: input.actorId,
        action: "DISPLAY_MODE_CHANGED",
        entity: "EventControl",
        entityId: updated.id,
        metadata: {
          from: input.previousDisplayMode,
          to: input.nextDisplayMode,
        },
      },
      tx,
    );

    return mapEventControlRecord(updated);
  });
}
