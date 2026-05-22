import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentPublicVotingState } from "@/server/modules/voting/service";

export async function GET() {
  try {
    const data = await getCurrentPublicVotingState({});
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
