import type { ApiResponse } from "@/shared/types/api.types";

import type {
  PublicCurrentVoteState,
  PublicVotePayload,
  VoteApiResult,
  VoteSubmitResponse,
} from "../types";

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function getCurrentPublicVoteState(): Promise<VoteApiResult<PublicCurrentVoteState>> {
  try {
    const response = await fetch("/api/v1/vote/current", {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const payload = await readApiResponse<PublicCurrentVoteState>(response);
    if (!response.ok || !payload) {
      return { ok: false, error: "تعذر تحميل حالة التصويت." };
    }

    if (payload.error || !payload.data) {
      return { ok: false, error: payload.error ?? "تعذر تحميل حالة التصويت." };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: "حدث خطأ أثناء الاتصال بخدمة التصويت." };
  }
}

export async function submitPublicVote(
  input: PublicVotePayload,
): Promise<VoteApiResult<VoteSubmitResponse>> {
  try {
    const response = await fetch("/api/v1/vote/public", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        matchId: input.matchId,
        teamId: input.teamId,
        fingerprintHash: input.fingerprintHash,
      }),
    });

    const payload = await readApiResponse<VoteSubmitResponse>(response);
    if (!response.ok || !payload) {
      return { ok: false, error: "تعذر إرسال التصويت." };
    }

    if (payload.error || !payload.data) {
      return { ok: false, error: payload.error ?? "تعذر إرسال التصويت." };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: "حدث خطأ أثناء إرسال التصويت." };
  }
}
