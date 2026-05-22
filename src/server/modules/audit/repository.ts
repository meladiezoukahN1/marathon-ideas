import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

import type { AuditLogCreateResult, CreateAuditLogInput } from "./types";

export async function createAuditLog(
  input: CreateAuditLogInput,
  tx?: Prisma.TransactionClient,
): Promise<AuditLogCreateResult> {
  const db = tx ?? prisma;

  const created = await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return created;
}
