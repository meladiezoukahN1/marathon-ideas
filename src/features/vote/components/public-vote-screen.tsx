"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";

import { getCurrentPublicVoteState, submitPublicVote } from "../lib/vote-api";
import {
  getOrCreateVisitorFingerprint,
  hasVoteMarker,
  setVoteMarker,
} from "../lib/vote-storage";
import type { PublicCurrentVoteState } from "../types";
import { VoteStatus } from "./vote-status";
import { VoteSuccess } from "./vote-success";
import { VoteTeamCard } from "./vote-team-card";

export function PublicVoteScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PublicCurrentVoteState | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await getCurrentPublicVoteState();

      if (!active) {
        return;
      }

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setState(result.data);

      const matchId = result.data.currentMatch?.id;
      if (matchId && hasVoteMarker(matchId)) {
        setAlreadyVoted(true);
      }

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

    const fingerprintHash = getOrCreateVisitorFingerprint();
    if (!fingerprintHash) {
      setSubmitting(false);
      setError("تعذر إنشاء معرف المتصفح. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.");
      return;
    }

    const result = await submitPublicVote({
      matchId: currentMatch.id,
      teamId: selectedTeamId,
      fingerprintHash,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    setVoteMarker(currentMatch.id);
    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return <LoadingState label="جاري تحميل حالة التصويت" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (!currentMatch) {
    return <EmptyState title="لا توجد جولة تصويت نشطة" description="سيظهر التصويت عند فتح الجولة الحالية." />;
  }

  if (!state?.votingOpen) {
    return <EmptyState title="التصويت غير متاح حالياً" description="يرجى الانتظار حتى يقوم المشرف بفتح التصويت." />;
  }

  if (alreadyVoted || submitted) {
    return (
      <div className="space-y-4">
        <VoteStatus title="تم استلام تصويتك" subtitle="شكراً لمشاركتك في تقييم الجولة الحالية." />
        <VoteSuccess
          title="تم تسجيل التصويت بنجاح"
          description="لقد قمت بالتصويت في هذه الجولة بالفعل. يمكنك متابعة شاشة العرض لمعرفة المستجدات."
        />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <VoteStatus title="اختر فريقاً واحداً" subtitle="يمكنك التصويت مرة واحدة فقط في هذه الجولة." />

      <div className="grid gap-4 sm:grid-cols-2">
        <VoteTeamCard
          title="الفريق الأول"
          teamId={currentMatch.team1Id}
          selected={selectedTeamId === currentMatch.team1Id}
          disabled={submitting}
          onSelect={setSelectedTeamId}
        />
        <VoteTeamCard
          title="الفريق الثاني"
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
