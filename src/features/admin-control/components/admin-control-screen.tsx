"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import type {
  AdminDisplayModeRequest,
  AdminPhaseRequest,
  AdminResolveTieRequest,
  AdminTimerRequest,
} from "@/shared/types/api.types";
import type { EventState } from "@/shared/types/domain.types";

import {
  applyTimerAction,
  changeDisplayMode,
  changeMatchPhase,
  closeVoting,
  getEventState,
  getLiveResults,
  openVoting,
  resolveTie,
  showResult,
} from "../lib/admin-api";
import type { LiveResultData } from "../types";
import { AdminStatusPanel } from "./admin-status-panel";
import { DisplayModeControl } from "./display-mode-control";
import { LiveResultsPanel } from "./live-results-panel";
import { MatchPhaseControl } from "./match-phase-control";
import { ResultControl } from "./result-control";
import { TimerControl } from "./timer-control";
import { VotingControl } from "./voting-control";

export function AdminControlScreen() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [liveResult, setLiveResult] = useState<LiveResultData | null>(null);

  async function loadState() {
    const result = await getEventState();
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setEventState(result.data);
    setError(null);
  }

  useEffect(() => {
    let active = true;

    async function init() {
      const result = await getEventState();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }

      setEventState(result.data);
      setLoading(false);
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  const currentMatch = useMemo(() => {
    if (!eventState || !eventState.currentMatchId) {
      return null;
    }
    return eventState.matches.find((match) => match.id === eventState.currentMatchId) ?? null;
  }, [eventState]);

  async function runMutation(
    action: () => Promise<{ ok: boolean; message?: string }>,
    successMessage: string,
  ) {
    setPending(true);
    setFeedback(null);

    const result = await action();
    if (!result.ok) {
      setFeedback({ kind: "error", message: result.message ?? "تعذر تنفيذ الإجراء المطلوب." });
      setPending(false);
      return;
    }

    await loadState();
    setFeedback({ kind: "success", message: successMessage });
    setPending(false);
  }

  const handleDisplayMode = async (payload: AdminDisplayModeRequest) => {
    await runMutation(
      async () => {
        const result = await changeDisplayMode(payload);
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم تحديث وضع شاشة العرض بنجاح.",
    );
  };

  const handleMatchPhase = async (payload: AdminPhaseRequest) => {
    await runMutation(
      async () => {
        const result = await changeMatchPhase(payload);
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم تحديث مرحلة النزال بنجاح.",
    );
  };

  const handleTimerAction = async (payload: AdminTimerRequest) => {
    await runMutation(
      async () => {
        const result = await applyTimerAction(payload);
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم تنفيذ إجراء المؤقت بنجاح.",
    );
  };

  const handleOpenVoting = async (matchId: string) => {
    await runMutation(
      async () => {
        const result = await openVoting({ matchId });
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم فتح التصويت بنجاح.",
    );
  };

  const handleCloseVoting = async (matchId: string) => {
    await runMutation(
      async () => {
        const result = await closeVoting({ matchId });
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم إغلاق التصويت بنجاح.",
    );
  };

  const handleShowResult = async (matchId: string) => {
    await runMutation(
      async () => {
        const result = await showResult({ matchId });
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم تنفيذ إجراء عرض النتيجة.",
    );
  };

  const handleResolveTie = async (payload: AdminResolveTieRequest) => {
    await runMutation(
      async () => {
        const result = await resolveTie(payload);
        return result.ok ? { ok: true } : { ok: false, message: result.message };
      },
      "تم تنفيذ حسم التعادل.",
    );
  };

  const handleReadLiveResults = async (matchId: string) => {
    setPending(true);
    const result = await getLiveResults(matchId);
    if (!result.ok) {
      setFeedback({ kind: "error", message: result.message });
      setPending(false);
      return;
    }

    setLiveResult(result.data);
    setFeedback({ kind: "success", message: "تم تحميل النتائج المباشرة." });
    setPending(false);
  };

  if (loading) {
    return <LoadingState label="جاري تحميل لوحة التحكم" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (!eventState) {
    return <EmptyState title="لا توجد حالة حدث" description="تعذر العثور على بيانات الحدث الحالية." />;
  }

  return (
    <div className="space-y-6 pb-6">
      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.kind === "success"
              ? "border-border bg-secondary text-secondary-foreground"
              : "border-destructive bg-destructive text-destructive-foreground"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <AdminStatusPanel eventState={eventState} currentMatch={currentMatch} />

      <DisplayModeControl disabled={pending} onChange={handleDisplayMode} />

      <MatchPhaseControl
        matchId={eventState.currentMatchId}
        disabled={pending}
        onChange={handleMatchPhase}
      />

      <TimerControl
        matchId={eventState.currentMatchId}
        disabled={pending}
        onAction={handleTimerAction}
      />

      <VotingControl
        matchId={eventState.currentMatchId}
        disabled={pending}
        onOpen={handleOpenVoting}
        onClose={handleCloseVoting}
      />

      <ResultControl
        currentMatch={currentMatch}
        disabled={pending}
        onShowResult={handleShowResult}
        onResolveTie={handleResolveTie}
      />

      <LiveResultsPanel
        matchId={eventState.currentMatchId}
        disabled={pending}
        data={liveResult}
        onRead={handleReadLiveResults}
      />
    </div>
  );
}
