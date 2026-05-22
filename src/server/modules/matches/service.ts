import { ConflictError, NotFoundError } from "../../core/errors";

import { assertCanControlMatch } from "./policy";
import {
  applyTimerActionWithAudit,
  getCurrentMatchFromEventControl,
  getMatchById,
  updateMatchPhaseWithAudit,
  updateVotingStateWithAudit,
} from "./repository";
import type {
  ChangeMatchPhaseCommand,
  MatchRecord,
  TimerActionCommand,
  VotingControlCommand,
} from "./types";
import {
  validateCloseVotingInput,
  validateChangeMatchPhaseInput,
  validateOpenVotingInput,
  validateTimerActionInput,
} from "./validator";
import { assertValidMatchPhaseTransition } from "./workflow";

export async function getMatchByIdOrNull(matchId: string): Promise<MatchRecord | null> {
  return getMatchById(matchId);
}

export async function getMatchByIdOrThrow(matchId: string): Promise<MatchRecord> {
  const match = await getMatchById(matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${matchId}`);
  }

  return match;
}

// No fallback inference is allowed for current match.
export async function getCurrentMatchOrNull(): Promise<MatchRecord | null> {
  return getCurrentMatchFromEventControl();
}

// Use this contract where current match is required.
export async function getCurrentMatchOrThrow(): Promise<MatchRecord> {
  const current = await getCurrentMatchFromEventControl();

  if (!current) {
    throw new NotFoundError("Current match is not set in event control");
  }

  return current;
}

export async function changeMatchPhase(
  input: unknown,
  command: ChangeMatchPhaseCommand,
): Promise<MatchRecord> {
  const validated = validateChangeMatchPhaseInput(input);
  assertCanControlMatch(command.actor);

  const match = await getMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertValidMatchPhaseTransition(match.phase, validated.phase);

  return updateMatchPhaseWithAudit({
    matchId: match.id,
    fromPhase: match.phase,
    toPhase: validated.phase,
    actorId: command.actor.id,
  });
}

export async function openVoting(
  input: unknown,
  command: VotingControlCommand,
): Promise<MatchRecord> {
  const validated = validateOpenVotingInput(input);
  assertCanControlMatch(command.actor);

  const match = await getMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertValidMatchPhaseTransition(match.phase, "VOTING");

  return updateVotingStateWithAudit({
    matchId: match.id,
    fromPhase: match.phase,
    toPhase: "VOTING",
    actorId: command.actor.id,
    auditAction: "VOTING_OPENED",
    voteOpenAt: new Date(),
    voteCloseAt: null,
  });
}

export async function closeVoting(
  input: unknown,
  command: VotingControlCommand,
): Promise<MatchRecord> {
  const validated = validateCloseVotingInput(input);
  assertCanControlMatch(command.actor);

  const match = await getMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  if (match.phase !== "VOTING") {
    throw new ConflictError("Voting can be closed only while match is in VOTING phase");
  }

  return updateVotingStateWithAudit({
    matchId: match.id,
    fromPhase: match.phase,
    toPhase: "CLOSED",
    actorId: command.actor.id,
    auditAction: "VOTING_CLOSED",
    voteCloseAt: new Date(),
    timerActive: false,
  });
}

export async function applyTimerAction(
  input: unknown,
  command: TimerActionCommand,
): Promise<MatchRecord> {
  const validated = validateTimerActionInput(input);
  assertCanControlMatch(command.actor);

  return applyTimerActionWithAudit({
    matchId: validated.matchId,
    action: validated.action,
    delta: validated.delta,
    actorId: command.actor.id,
  });
}
