import { ConflictError, ForbiddenError } from "../../core/errors";
import { isJuryRole } from "../../../shared/constants/permissions";

import type { CurrentUser } from "../../core/session";
import type { MatchPhaseValue, VotingMatchSnapshot } from "./types";

export function assertMatchPhaseIsVoting(phase: MatchPhaseValue): void {
  if (phase !== "VOTING") {
    throw new ConflictError("Voting is allowed only during VOTING phase");
  }
}

export function assertTeamBelongsToMatch(teamId: string, match: VotingMatchSnapshot): void {
  if (teamId !== match.team1Id && teamId !== match.team2Id) {
    throw new ConflictError("Selected team does not belong to this match");
  }
}

export function assertActorIsJury(actor: CurrentUser | null | undefined): void {
  if (!actor || !isJuryRole(actor.role)) {
    throw new ForbiddenError("Only JURY users can submit jury votes");
  }
}
