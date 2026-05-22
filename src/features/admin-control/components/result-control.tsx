import { useState } from "react";

import type { MatchPublic } from "@/shared/types/domain.types";

interface ResultControlProps {
  currentMatch: MatchPublic | null;
  disabled?: boolean;
  onShowResult: (matchId: string) => void;
  onResolveTie: (payload: { matchId: string; winnerId: string }) => void;
}

export function ResultControl({
  currentMatch,
  disabled = false,
  onShowResult,
  onResolveTie,
}: ResultControlProps) {
  const [winnerId, setWinnerId] = useState<string>(currentMatch?.team1.id ?? "");

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">النتائج</h2>

      {currentMatch ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onShowResult(currentMatch.id)}
            className="w-full rounded-xl border border-destructive bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            عرض النتيجة
          </button>

          <label className="block text-sm text-muted-foreground">
            معرف الفائز لحسم التعادل
            <select
              value={winnerId}
              onChange={(event) => setWinnerId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value={currentMatch.team1.id}>{currentMatch.team1.id}</option>
              <option value={currentMatch.team2.id}>{currentMatch.team2.id}</option>
            </select>
          </label>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onResolveTie({ matchId: currentMatch.id, winnerId })}
            className="w-full rounded-xl border border-destructive bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            حسم التعادل
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا يوجد نزال حالي لإجراءات النتائج.</p>
      )}
    </section>
  );
}
