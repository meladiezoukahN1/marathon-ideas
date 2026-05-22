import { hashIp } from "@/lib/anti-duplicate";
import { apiSuccess, handleRouteError } from "@/server/core/response";
import { submitPublicVote } from "@/server/modules/voting/service";

function getFirstForwardedIp(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const first = headerValue.split(",")[0]?.trim();
  return first || null;
}

function getMatchIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null || !("matchId" in body)) {
    return "";
  }

  const value = (body as { matchId?: unknown }).matchId;
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    const forwardedIp = getFirstForwardedIp(request.headers.get("x-forwarded-for"));
    const realIp = request.headers.get("x-real-ip");
    const rawIp = forwardedIp || realIp || "unknown";

    const matchId = getMatchIdFromBody(body);
    const hashedIp = hashIp(rawIp, matchId);

    const data = await submitPublicVote(body, { hashedIp });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
