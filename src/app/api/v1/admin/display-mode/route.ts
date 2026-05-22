import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getCurrentUser } from "@/server/core/session";
import { changeDisplayMode } from "@/server/modules/event-control/service";

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser(true);
    const body = (await request.json()) as unknown;
    const data = await changeDisplayMode(body, { actor });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
