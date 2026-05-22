import { BadRequestError, NotFoundError } from "../../core/errors";
import { calculateFinalVote, VoteCalculationError } from "../../../lib/vote-calc";

import {
  getMatchVoteTotals,
  getLiveResultMatchById,
  getResultMatchById,
  resolveTieWithAudit,
  saveCalculatedResultWithAudit,
} from "./repository";
import {
  assertCanManageResults,
  assertCanViewLiveResults,
  assertMatchIsTiePending,
  assertPhaseAllowsResultShow,
  assertWinnerBelongsToMatch,
} from "./policy";
import type {
  LiveResultCommand,
  LiveResultSnapshot,
  ResultMutationCommand,
  ResultMutationResult,
} from "./types";
import { validateLiveResultInput, validateResolveTieInput, validateShowResultInput } from "./validator";

export async function getLiveResults(
  input: unknown,
  command: LiveResultCommand,
): Promise<LiveResultSnapshot> {
  const validated = validateLiveResultInput(input);

  assertCanViewLiveResults(command.actor);

  const match = await getLiveResultMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  return match;
}

export async function showCalculatedResult(
  input: unknown,
  command: ResultMutationCommand,
): Promise<ResultMutationResult> {
  const validated = validateShowResultInput(input);

  assertCanManageResults(command.actor);

  const match = await getResultMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertPhaseAllowsResultShow(match.phase);

  const totals = await getMatchVoteTotals({
    id: match.id,
    team1Id: match.team1Id,
    team2Id: match.team2Id,
  });

  let calculation;

  try {
    calculation = calculateFinalVote({
      juryMembersCount: totals.activeJuryCount,
      juryVotesTeam1: totals.juryVotesTeam1,
      juryVotesTeam2: totals.juryVotesTeam2,
      publicVotesTeam1: totals.publicVotesTeam1,
      publicVotesTeam2: totals.publicVotesTeam2,
    });
  } catch (error) {
    if (error instanceof VoteCalculationError) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }

  const isTie = calculation.isTie;
  const winnerId = isTie
    ? null
    : calculation.winnerSide === "team1"
      ? match.team1Id
      : match.team2Id;

  return saveCalculatedResultWithAudit({
    matchId: match.id,
    actorId: command.actor.id,
    team1Final: calculation.team1Final,
    team2Final: calculation.team2Final,
    winnerId,
    resultStatus: isTie ? "TIE_PENDING" : "CALCULATED",
  });
}

export async function resolveTieResult(
  input: unknown,
  command: ResultMutationCommand,
): Promise<ResultMutationResult> {
  const validated = validateResolveTieInput(input);

  assertCanManageResults(command.actor);

  const match = await getResultMatchById(validated.matchId);

  if (!match) {
    throw new NotFoundError(`Match not found: ${validated.matchId}`);
  }

  assertMatchIsTiePending(match.resultStatus);
  assertWinnerBelongsToMatch(validated.winnerId, match);

  return resolveTieWithAudit({
    matchId: match.id,
    winnerId: validated.winnerId,
    actorId: command.actor.id,
  });
}
