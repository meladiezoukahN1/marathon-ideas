import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentUser } from "@/server/core/session";
import { submitJuryVote } from "@/server/modules/voting/service";

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser(true);
    const body = (await request.json()) as unknown;
    const data = await submitJuryVote(body, { actor });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
