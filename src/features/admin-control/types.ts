import type {
  AdminDisplayModeRequest,
  AdminPhaseRequest,
  AdminResolveTieRequest,
  AdminShowResultRequest,
  AdminTimerRequest,
  ApiResponse,
} from "@/shared/types/api.types";
import type { EventState, MatchPublic } from "@/shared/types/domain.types";

export type AdminApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type EventStateApiResponse = ApiResponse<EventState>;

export interface LiveResultData {
  id: string;
  phase: string;
  resultStatus: string;
  winnerId: string | null;
  team1Final: number | null;
  team2Final: number | null;
  resultShownAt: string | null;
}

export type LiveResultApiResponse = ApiResponse<LiveResultData>;

export interface AdminControlScreenState {
  eventState: EventState | null;
  currentMatch: MatchPublic | null;
  feedback: { kind: "success" | "error"; message: string } | null;
  loading: boolean;
  pending: boolean;
}

export type DisplayModeInput = AdminDisplayModeRequest;
export type MatchPhaseInput = AdminPhaseRequest;
export type TimerActionInput = AdminTimerRequest;
export type ShowResultInput = AdminShowResultRequest;
export type ResolveTieInput = AdminResolveTieRequest;
