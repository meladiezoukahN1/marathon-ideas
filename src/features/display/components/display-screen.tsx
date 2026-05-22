import { EmptyState } from "@/components/common/empty-state";

import { BracketPreview } from "./bracket-preview";
import { DisplayStatus } from "./display-status";
import { TeamPresentation } from "./team-presentation";
import { VotingDisplay } from "./voting-display";
import { WinnerReveal } from "./winner-reveal";
import type { DisplayViewModel, SupportedDisplayMode } from "../types";

interface DisplayScreenProps {
  view: DisplayViewModel;
}

const MODE_LABELS: Record<SupportedDisplayMode, string> = {
  EVENT_WAITING: "بانتظار بدء الحدث",
  BRACKET_PREVIEW: "استعراض شجرة المنافسة",
  PRESENTING_TEAM: "عرض الفريق",
  VOTING: "التصويت المباشر",
  VOTING_CLOSED: "تم إغلاق التصويت",
  WINNER_REVEAL: "إعلان النتيجة",
  BRACKET_UPDATE: "تحديث شجرة المنافسة",
  FINAL_BRACKET: "الشجرة النهائية",
  EVENT_FINISHED: "انتهاء الحدث",
};

function WaitingPanel() {
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-10 text-center sm:p-16">
      <p className="text-lg font-semibold text-muted-foreground">المنصة جاهزة</p>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-card-foreground sm:text-6xl">ماراثون الأفكار</h2>
      <p className="mt-5 text-xl font-semibold text-primary">بانتظار انطلاق الجولة الأولى</p>
    </section>
  );
}

function FinishedPanel() {
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-10 text-center sm:p-16">
      <p className="text-lg font-semibold text-muted-foreground">ختام الفعالية</p>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-card-foreground sm:text-6xl">شكراً لمشاركتكم</h2>
    </section>
  );
}

export function DisplayScreen({ view }: DisplayScreenProps) {
  const modeLabel = MODE_LABELS[view.mode];
  const subLabel = view.currentMatch ? view.currentMatch.challenge.nameAr : "";

  return (
    <div className="flex w-full flex-col gap-6 py-4 sm:gap-8 sm:py-8">
      <DisplayStatus modeLabel={modeLabel} subLabel={subLabel} />

      {view.mode === "EVENT_WAITING" ? <WaitingPanel /> : null}

      {view.mode === "BRACKET_PREVIEW" || view.mode === "BRACKET_UPDATE" || view.mode === "FINAL_BRACKET" ? (
        <BracketPreview nodes={view.bracketNodes} currentMatchId={view.eventState.currentMatchId} />
      ) : null}

      {view.mode === "PRESENTING_TEAM" ? (
        view.teamPresentation ? (
          <TeamPresentation data={view.teamPresentation} />
        ) : (
          <EmptyState title="لا يوجد فريق للعرض" description="لا توجد بيانات كافية لعرض الفريق الحالي." />
        )
      ) : null}

      {view.mode === "VOTING" || view.mode === "VOTING_CLOSED" ? (
        view.votingDisplay ? (
          <VotingDisplay data={view.votingDisplay} />
        ) : (
          <EmptyState title="لا توجد بيانات تصويت" description="لا يمكن عرض معلومات التصويت حالياً." />
        )
      ) : null}

      {view.mode === "WINNER_REVEAL" ? (
        view.winnerReveal ? (
          <WinnerReveal data={view.winnerReveal} />
        ) : (
          <EmptyState title="لا يوجد فائز بعد" description="سيتم عرض النتيجة فور اعتمادها." />
        )
      ) : null}

      {view.mode === "EVENT_FINISHED" ? <FinishedPanel /> : null}
    </div>
  );
}
