import type { ApiResponse } from "@/shared/types/api.types";

import type {
  CurrentJuryVoteState,
  JuryApiResult,
  JuryVotePayload,
  JuryVoteSubmitResponse,
} from "../types";

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function getCurrentJuryVoteState(): Promise<JuryApiResult<CurrentJuryVoteState>> {
  try {
    const response = await fetch("/api/v1/jury/current", {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const payload = await parseApiResponse<CurrentJuryVoteState>(response);
    if (!response.ok || !payload) {
      return { ok: false, error: "تعذر تحميل حالة تصويت لجنة التحكيم." };
    }

    if (payload.error || !payload.data) {
      return { ok: false, error: payload.error ?? "تعذر تحميل حالة تصويت لجنة التحكيم." };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: "حدث خطأ أثناء الاتصال بخدمة لجنة التحكيم." };
  }
}

export async function submitJuryVote(
  input: JuryVotePayload,
): Promise<JuryApiResult<JuryVoteSubmitResponse>> {
  try {
    const response = await fetch("/api/v1/vote/jury", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        matchId: input.matchId,
        teamId: input.teamId,
      }),
    });

    const payload = await parseApiResponse<JuryVoteSubmitResponse>(response);
    if (!response.ok || !payload) {
      return { ok: false, error: "تعذر إرسال تصويت لجنة التحكيم." };
    }

    if (payload.error || !payload.data) {
      return { ok: false, error: payload.error ?? "تعذر إرسال تصويت لجنة التحكيم." };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, error: "حدث خطأ أثناء إرسال التصويت." };
  }
}
