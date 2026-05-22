import type {
  AdminDisplayModeRequest,
  AdminPhaseRequest,
  AdminResolveTieRequest,
  AdminShowResultRequest,
  AdminTimerRequest,
  ApiResponse,
} from "@/shared/types/api.types";
import type { EventState } from "@/shared/types/domain.types";

import type { AdminApiResult, LiveResultData } from "../types";

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

async function getRequest<T>(url: string, fallbackMessage: string): Promise<AdminApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const payload = await parseApiResponse<T>(response);
    if (!response.ok || !payload || !payload.data) {
      return { ok: false, message: fallbackMessage };
    }

    if (payload.error) {
      return { ok: false, message: fallbackMessage };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, message: fallbackMessage };
  }
}

async function postRequest<TBody extends object, TResponse>(
  url: string,
  body: TBody,
  fallbackMessage: string,
): Promise<AdminApiResult<TResponse>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await parseApiResponse<TResponse>(response);
    if (!response.ok || !payload || !payload.data) {
      return { ok: false, message: fallbackMessage };
    }

    if (payload.error) {
      return { ok: false, message: fallbackMessage };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, message: fallbackMessage };
  }
}

export async function getEventState(): Promise<AdminApiResult<EventState>> {
  return getRequest<EventState>("/api/v1/event/state", "تعذر تحميل حالة الحدث الحالية.");
}

export async function changeDisplayMode(
  input: AdminDisplayModeRequest,
): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<AdminDisplayModeRequest, { id: string }>(
    "/api/v1/admin/display-mode",
    input,
    "تعذر تغيير وضع شاشة العرض.",
  );
}

export async function changeMatchPhase(
  input: AdminPhaseRequest,
): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<AdminPhaseRequest, { id: string }>(
    "/api/v1/admin/match/phase",
    input,
    "تعذر تغيير مرحلة النزال.",
  );
}

export async function applyTimerAction(
  input: AdminTimerRequest,
): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<AdminTimerRequest, { id: string }>(
    "/api/v1/admin/timer",
    input,
    "تعذر تنفيذ إجراء المؤقت.",
  );
}

export async function openVoting(input: { matchId: string }): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<{ matchId: string }, { id: string }>(
    "/api/v1/admin/voting/open",
    input,
    "تعذر فتح التصويت.",
  );
}

export async function closeVoting(input: { matchId: string }): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<{ matchId: string }, { id: string }>(
    "/api/v1/admin/voting/close",
    input,
    "تعذر إغلاق التصويت.",
  );
}

export async function showResult(
  input: AdminShowResultRequest,
): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<AdminShowResultRequest, { id: string }>(
    "/api/v1/admin/result/show",
    input,
    "تعذر عرض النتيجة.",
  );
}

export async function resolveTie(
  input: AdminResolveTieRequest,
): Promise<AdminApiResult<{ id: string }>> {
  return postRequest<AdminResolveTieRequest, { id: string }>(
    "/api/v1/admin/result/resolve-tie",
    input,
    "تعذر حسم التعادل.",
  );
}

export async function getLiveResults(matchId: string): Promise<AdminApiResult<LiveResultData>> {
  const encoded = encodeURIComponent(matchId);
  return getRequest<LiveResultData>(
    `/api/v1/admin/results/live?matchId=${encoded}`,
    "تعذر تحميل النتائج المباشرة.",
  );
}
