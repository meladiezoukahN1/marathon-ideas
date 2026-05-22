import { apiSuccess, handleRouteError } from "@/server/core/response";
import { getEventState } from "@/server/modules/bracket/service";

export async function GET() {
  try {
    const data = await getEventState();
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
