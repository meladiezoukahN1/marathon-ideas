import type { EventState, MatchPublic } from "@/shared/types/domain.types";

interface AdminStatusPanelProps {
  eventState: EventState;
  currentMatch: MatchPublic | null;
}

export function AdminStatusPanel({ eventState, currentMatch }: AdminStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">الحالة الحالية</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">وضع الشاشة</p>
          <p className="mt-1 text-sm font-bold text-foreground">{eventState.displayMode}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">النزال الحالي</p>
          <p className="mt-1 text-sm font-bold text-foreground">{eventState.currentMatchId ?? "لا يوجد"}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">التحدي</p>
          <p className="mt-1 text-sm font-bold text-foreground">{currentMatch?.challenge.nameAr ?? "غير محدد"}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">مرحلة النزال</p>
          <p className="mt-1 text-sm font-bold text-foreground">{currentMatch?.phase ?? "غير محدد"}</p>
        </div>
      </div>
    </section>
  );
}
