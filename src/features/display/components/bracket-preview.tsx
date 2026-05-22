import type { BracketNode } from "@/shared/types/domain.types";

interface BracketPreviewProps {
  nodes: BracketNode[];
  currentMatchId: string | null;
}

export function BracketPreview({ nodes, currentMatchId }: BracketPreviewProps) {
  return (
    <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node, index) => {
        const challengeNumber = index + 1;
        const isCurrent = currentMatchId ? currentMatchId === node.challenge.id : index === 0;

        return (
          <article
            key={node.challenge.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              التحدي {challengeNumber}
            </p>
            <h3 className="mt-2 text-xl font-bold text-card-foreground">{node.challenge.nameAr}</h3>

            <div className="mt-5 space-y-3">
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground">
                {node.team1.nameAr}
              </p>
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground">
                {node.team2.nameAr}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">الفائز</p>
              <p className="mt-1 text-base font-bold text-card-foreground">{node.winner?.nameAr ?? "بانتظار النتيجة"}</p>
            </div>

            <p className="mt-4 text-sm font-semibold text-primary">
              {isCurrent ? "الجولة الحالية" : node.isCompleted ? "مكتمل" : "قادم"}
            </p>
          </article>
        );
      })}
    </section>
  );
}
