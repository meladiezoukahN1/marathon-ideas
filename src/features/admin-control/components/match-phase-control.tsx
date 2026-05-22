import type { AdminPhaseRequest } from "@/shared/types/api.types";

interface MatchPhaseControlProps {
  matchId: string | null;
  disabled?: boolean;
  onChange: (payload: AdminPhaseRequest) => void;
}

const PHASES: AdminPhaseRequest["phase"][] = [
  "WAITING",
  "BRACKET_PREVIEW",
  "PRESENTING_TEAM1",
  "PRESENTING_TEAM2",
  "VOTING",
  "CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "RESULT",
];

export function MatchPhaseControl({ matchId, disabled = false, onChange }: MatchPhaseControlProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">التحكم في النزال</h2>
      {matchId ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ matchId, phase })}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا يوجد نزال حالي لاختيار المرحلة.</p>
      )}
    </section>
  );
}
