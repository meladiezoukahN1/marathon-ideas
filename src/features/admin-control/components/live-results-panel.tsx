import type { LiveResultData } from "../types";

interface LiveResultsPanelProps {
  matchId: string | null;
  disabled?: boolean;
  data: LiveResultData | null;
  onRead: (matchId: string) => void;
}

export function LiveResultsPanel({
  matchId,
  disabled = false,
  data,
  onRead,
}: LiveResultsPanelProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="text-lg font-bold text-card-foreground">قراءة النتائج المباشرة</h3>

      {matchId ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRead(matchId)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            جلب النتائج المباشرة
          </button>

          {data ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <p className="mt-1 font-semibold">{data.resultStatus}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                <p className="text-xs text-muted-foreground">الفائز</p>
                <p className="mt-1 font-semibold">{data.winnerId ?? "غير محدد"}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                <p className="text-xs text-muted-foreground">نتيجة الفريق 1</p>
                <p className="mt-1 font-semibold">{data.team1Final ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                <p className="text-xs text-muted-foreground">نتيجة الفريق 2</p>
                <p className="mt-1 font-semibold">{data.team2Final ?? "-"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد نتائج مباشرة محمّلة حالياً.</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا يوجد نزال حالي لقراءة النتائج المباشرة.</p>
      )}
    </section>
  );
}
