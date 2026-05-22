import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentUser } from "@/server/core/session";
import { getLiveResults } from "@/server/modules/results/service";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(true);
    const matchId = new URL(request.url).searchParams.get("matchId") ?? "";
    const data = await getLiveResults({ matchId }, { actor });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
