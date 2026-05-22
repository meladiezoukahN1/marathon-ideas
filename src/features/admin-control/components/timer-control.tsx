import { useState } from "react";

import type { AdminTimerRequest } from "@/shared/types/api.types";

interface TimerControlProps {
  matchId: string | null;
  disabled?: boolean;
  onAction: (payload: AdminTimerRequest) => void;
}

export function TimerControl({ matchId, disabled = false, onAction }: TimerControlProps) {
  const [delta, setDelta] = useState<number>(10);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">التحكم في المؤقت</h2>
      {matchId ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAction({ matchId, action: "play" })}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              تشغيل
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAction({ matchId, action: "pause" })}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              إيقاف مؤقت
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAction({ matchId, action: "reset" })}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              إعادة ضبط
            </button>
          </div>

          <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm text-muted-foreground">
              قيمة التعديل (ثانية)
              <input
                type="number"
                value={delta}
                onChange={(event) => setDelta(Number(event.target.value || 0))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAction({ matchId, action: "adjust", delta })}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              تطبيق التعديل
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا يوجد نزال حالي للتحكم في المؤقت.</p>
      )}
    </section>
  );
}
