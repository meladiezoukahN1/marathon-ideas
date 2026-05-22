import type { WinnerRevealModel } from "../types";

interface WinnerRevealProps {
  data: WinnerRevealModel;
}

export function WinnerReveal({ data }: WinnerRevealProps) {
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
      <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">إعلان الفائز</p>
      <h2 className="mt-3 text-3xl font-black text-card-foreground sm:text-5xl">{data.challengeName}</h2>
      <p className="mt-8 text-xl font-semibold text-muted-foreground">الفريق الفائز</p>
      <p className="mt-3 text-5xl font-black text-primary sm:text-7xl">{data.winner?.nameAr ?? "بانتظار الحسم"}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background px-6 py-5">
          <p className="text-sm text-muted-foreground">مجموع الفريق الأول</p>
          <p className="mt-2 text-3xl font-black text-foreground">{data.team1Score}</p>
        </div>
        <div className="rounded-xl border border-border bg-background px-6 py-5">
          <p className="text-sm text-muted-foreground">مجموع الفريق الثاني</p>
          <p className="mt-2 text-3xl font-black text-foreground">{data.team2Score}</p>
        </div>
      </div>
    </section>
  );
}
