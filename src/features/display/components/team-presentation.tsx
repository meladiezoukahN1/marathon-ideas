import type { TeamPresentationModel } from "../types";

interface TeamPresentationProps {
  data: TeamPresentationModel;
}

export function TeamPresentation({ data }: TeamPresentationProps) {
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
      <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">عرض الفريق</p>
      <h2 className="mt-3 text-4xl font-black tracking-tight text-card-foreground sm:text-6xl">{data.team.nameAr}</h2>
      <p className="mt-4 text-xl font-semibold text-primary sm:text-2xl">{data.challengeName}</p>
      <p className="mt-6 max-w-4xl text-xl leading-9 text-foreground sm:text-2xl">{data.team.ideaAr}</p>
      <div className="mt-8 inline-flex rounded-xl border border-border bg-background px-6 py-3">
        <p className="text-lg font-bold text-card-foreground sm:text-2xl">الوقت: {data.timerSecs} ثانية</p>
      </div>
    </section>
  );
}
