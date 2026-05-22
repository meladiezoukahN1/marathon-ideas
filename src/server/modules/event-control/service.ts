import { NotFoundError } from "@/server/core/errors";

import { assertCanManageEventControl } from "./policy";
import {
  getCurrentEventControlRecord,
  updateDisplayModeWithAudit,
} from "./repository";
import type { ChangeDisplayModeCommand, EventControlRecord } from "./types";
import { validateChangeDisplayModeInput } from "./validator";
import { assertValidDisplayTransition } from "./workflow";

export async function getCurrentEventControl(): Promise<EventControlRecord | null> {
  return getCurrentEventControlRecord();
}

export async function changeDisplayMode(
  input: unknown,
  command: Omit<ChangeDisplayModeCommand, "displayMode">,
): Promise<EventControlRecord> {
  const validated = validateChangeDisplayModeInput(input);
  assertCanManageEventControl(command.actor);

  // Current mode is always loaded from repository, never trusted from client input.
  const current = await getCurrentEventControlRecord();

  if (!current) {
    throw new NotFoundError("Event control record not found");
  }

  assertValidDisplayTransition(current.displayMode, validated.displayMode);

  return updateDisplayModeWithAudit({
    eventControlId: current.id,
    previousDisplayMode: current.displayMode,
    nextDisplayMode: validated.displayMode,
    actorId: command.actor.id,
  });
}
