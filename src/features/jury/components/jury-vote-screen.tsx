"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";

import { getCurrentJuryVoteState, submitJuryVote } from "../lib/jury-api";
import type { CurrentJuryVoteState } from "../types";
import { JuryStatus } from "./jury-status";
import { JurySuccess } from "./jury-success";
import { JuryTeamCard } from "./jury-team-card";

export function JuryVoteScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<CurrentJuryVoteState | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await getCurrentJuryVoteState();

      if (!active) {
        return;
      }

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setState(result.data);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const currentMatch = state?.currentMatch ?? null;

  const canSubmit = useMemo(() => {
    return Boolean(state?.votingOpen && currentMatch && selectedTeamId && !submitting);
  }, [state?.votingOpen, currentMatch, selectedTeamId, submitting]);

  async function onSubmitVote() {
    if (!currentMatch || !selectedTeamId || !state?.votingOpen) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await submitJuryVote({
      matchId: currentMatch.id,
      teamId: selectedTeamId,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return <LoadingState label="جاري تحميل حالة تصويت لجنة التحكيم" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (!currentMatch) {
    return <EmptyState title="لا توجد جولة تصويت نشطة" description="سيظهر التصويت عند فتح الجولة الحالية." />;
  }

  if (state?.hasVoted || submitted) {
    return (
      <div className="space-y-4">
        <JuryStatus title="تم استلام تصويتك" subtitle="تم تسجيل تصويت لجنة التحكيم لهذه الجولة." />
        <JurySuccess
          title="تم اعتماد التصويت"
          description="لا يمكن إرسال تصويت إضافي في هذه الجولة."
        />
      </div>
    );
  }

  if (!state?.votingOpen) {
    return <EmptyState title="التصويت غير مفتوح حالياً" description="يرجى الانتظار حتى يقوم المشرف بفتح التصويت." />;
  }

  return (
    <section className="space-y-4">
      <JuryStatus title="اختر فريقاً واحداً" subtitle="صوتك يحسب مرة واحدة لكل جولة." />

      <div className="grid gap-4 sm:grid-cols-2">
        <JuryTeamCard
          label="الفريق 1"
          teamId={currentMatch.team1Id}
          selected={selectedTeamId === currentMatch.team1Id}
          disabled={submitting}
          onSelect={setSelectedTeamId}
        />
        <JuryTeamCard
          label="الفريق 2"
          teamId={currentMatch.team2Id}
          selected={selectedTeamId === currentMatch.team2Id}
          disabled={submitting}
          onSelect={setSelectedTeamId}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          void onSubmitVote();
        }}
        disabled={!canSubmit}
        className="w-full rounded-2xl border border-border bg-primary px-5 py-4 text-base font-bold text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "جاري إرسال التصويت..." : "إرسال التصويت"}
      </button>
    </section>
  );
}
