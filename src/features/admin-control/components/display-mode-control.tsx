import type { AdminDisplayModeRequest } from "@/shared/types/api.types";

interface DisplayModeControlProps {
  disabled?: boolean;
  onChange: (payload: AdminDisplayModeRequest) => void;
}

const DISPLAY_MODES: AdminDisplayModeRequest["displayMode"][] = [
  "EVENT_WAITING",
  "BRACKET_PREVIEW",
  "PRESENTING_TEAM",
  "VOTING",
  "VOTING_CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "FINAL_BRACKET",
  "EVENT_FINISHED",
];

export function DisplayModeControl({ disabled = false, onChange }: DisplayModeControlProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">التحكم في شاشة العرض</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {DISPLAY_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ displayMode: mode })}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode}
          </button>
        ))}
      </div>
    </section>
  );
}
