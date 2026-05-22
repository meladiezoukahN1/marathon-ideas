import { ConflictError, ForbiddenError } from "../../core/errors";
import { isAdminRole } from "../../../shared/constants/permissions";

import type { CurrentUser } from "../../core/session";
import type { MatchPhaseValue, ResultMatchSnapshot, ResultStatusValue } from "./types";

const PHASES_ALLOWED_FOR_RESULT_SHOW: readonly MatchPhaseValue[] = [
  "CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "RESULT",
];

export function assertCanManageResults(actor: CurrentUser): void {
  if (!actor || !isAdminRole(actor.role)) {
    throw new ForbiddenError("Only ADMIN or SUPERADMIN can manage results");
  }
}

export function assertCanViewLiveResults(actor: CurrentUser | null | undefined): void {
  if (!actor || !isAdminRole(actor.role)) {
    throw new ForbiddenError("Only ADMIN or SUPERADMIN can view live results");
  }
}

export function assertPhaseAllowsResultShow(phase: MatchPhaseValue): void {
  if (!PHASES_ALLOWED_FOR_RESULT_SHOW.includes(phase)) {
    throw new ConflictError("Result calculation/show is allowed only when match is CLOSED or later");
  }
}

export function assertWinnerBelongsToMatch(winnerId: string, match: ResultMatchSnapshot): void {
  if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
    throw new ConflictError("Tie winner must belong to the match");
  }
}

export function assertMatchIsTiePending(status: ResultStatusValue): void {
  if (status !== "TIE_PENDING") {
    throw new ConflictError("Tie resolution requires match resultStatus to be TIE_PENDING");
  }
}
