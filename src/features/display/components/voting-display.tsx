import type { VotingDisplayModel } from "../types";

interface VotingDisplayProps {
  data: VotingDisplayModel;
}

export function VotingDisplay({ data }: VotingDisplayProps) {
  return (
    <section className="grid w-full gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-border bg-card p-8 lg:col-span-2">
        <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">مرحلة التصويت</p>
        <h2 className="mt-3 text-3xl font-black text-card-foreground sm:text-5xl">{data.challengeName}</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background px-5 py-6">
            <p className="text-sm text-muted-foreground">الفريق الأول</p>
            <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{data.team1.nameAr}</p>
          </div>
          <div className="rounded-xl border border-border bg-background px-5 py-6">
            <p className="text-sm text-muted-foreground">الفريق الثاني</p>
            <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{data.team2.nameAr}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted px-5 py-4">
          <p className="text-lg font-semibold text-card-foreground">الوقت المتبقي</p>
          <p className="text-3xl font-black text-primary sm:text-4xl">{data.timerSecs}</p>
        </div>

        {data.voteClosed ? (
          <p className="mt-5 text-lg font-semibold text-destructive">تم إغلاق التصويت</p>
        ) : (
          <p className="mt-5 text-lg font-semibold text-primary">التصويت مفتوح الآن</p>
        )}
      </article>

      <aside className="rounded-2xl border border-dashed border-border bg-card p-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">رمز التصويت</p>
        <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-border bg-background">
          <p className="text-center text-lg font-bold text-card-foreground">QR Placeholder</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">سيظهر رمز التصويت الفعلي في جلسة لاحقة.</p>
      </aside>
    </section>
  );
}
