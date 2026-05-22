import { ConflictError, NotFoundError } from "../../core/errors";

import {
  checkPublicVoteDuplicate,
  getCurrentVotingMatchFromEventControl,
  getVotingMatchById,
  hasJuryVote,
  insertJuryVote,
  insertPublicVote,
} from "./repository";
import {
  assertActorIsJury,
  assertMatchPhaseIsVoting,
  assertTeamBelongsToMatch,
} from "./policy";
import type {
  CurrentJuryVotingState,
  CurrentPublicVotingState,
  JuryVoteCommand,
  VoteServiceSuccess,
} from "./types";
import {
  validateGetCurrentJuryVotingStateInput,
  validateGetCurrentPublicVotingStateInput,
  validateJuryVoteInput,
  validatePublicVoteInput,
} from "./validator";

export async function getCurrentPublicVotingState(
  input: unknown,
): Promise<CurrentPublicVotingState> {
  validateGetCurrentPublicVotingStateInput(input);

  const currentMatch = await getCurrentVotingMatchFromEventControl();

  return {
    currentMatch,
    votingOpen: Boolean(currentMatch && currentMatch.phase === "VOTING"),
  };
}

export async function getCurrentJuryVotingState(
  input: unknown,
  command: { actor: unknown },
): Promise<CurrentJuryVotingState> {
  validateGetCurrentJuryVotingStateInput(input);

  assertActorIsJury(command.actor as never);

  const currentMatch = await getCurrentVotingMatchFromEventControl();

  if (!currentMatch) {
    return {
      currentMatch: null,
      votingOpen: false,
      hasVoted: false,
    };
  }

  const actor = command.actor as { id: string };
  const hasAlreadyVoted = await hasJuryVote(currentMatch.id, actor.id);

  return {
    currentMatch,
    votingOpen: currentMatch.phase === "VOTING",
    hasVoted: hasAlreadyVoted,
  };
}

export async function submitPublicVote(
  input: unknown,
  command: { hashedIp: string },
): Promise<VoteServiceSuccess> {
  const validated = validatePublicVoteInput(input);

  const match = await getVotingMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertMatchPhaseIsVoting(match.phase);
  assertTeamBelongsToMatch(validated.teamId, match);

  const duplicate = await checkPublicVoteDuplicate(
    validated.matchId,
    command.hashedIp,
    validated.fingerprintHash,
  );

  if (duplicate.isDuplicate) {
    throw new ConflictError(`Duplicate public vote detected by ${duplicate.reason}`);
  }

  await insertPublicVote({
    matchId: validated.matchId,
    teamId: validated.teamId,
    hashedIp: command.hashedIp,
    fingerprintHash: validated.fingerprintHash,
  });

  return { success: true };
}

export async function submitJuryVote(
  input: unknown,
  command: JuryVoteCommand,
): Promise<VoteServiceSuccess> {
  const validated = validateJuryVoteInput(input);

  assertActorIsJury(command.actor);

  const match = await getVotingMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertMatchPhaseIsVoting(match.phase);
  assertTeamBelongsToMatch(validated.teamId, match);

  const alreadyVoted = await hasJuryVote(validated.matchId, command.actor.id);

  if (alreadyVoted) {
    throw new ConflictError("Jury user already voted for this match");
  }

  await insertJuryVote({
    matchId: validated.matchId,
    teamId: validated.teamId,
    userId: command.actor.id,
  });

  return { success: true };
}
