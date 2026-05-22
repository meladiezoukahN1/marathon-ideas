import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentUser } from "@/server/core/session";
import { getCurrentJuryVotingState } from "@/server/modules/voting/service";

export async function GET() {
  try {
    const actor = await getCurrentUser(true);
    const data = await getCurrentJuryVotingState({}, { actor });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
