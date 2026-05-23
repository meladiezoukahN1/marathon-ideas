interface VoteTeamCardProps {
  teamName: string;
  teamIdea?: string;
  teamId: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (teamId: string) => void;
}

export function VoteTeamCard({
  teamName,
  teamIdea,
  teamId,
  selected,
  disabled = false,
  onSelect,
}: VoteTeamCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(teamId)}
      className="w-full rounded-2xl border border-border bg-card px-5 py-6 text-right shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      aria-pressed={selected}
    >
      <p className="text-lg font-bold text-card-foreground sm:text-xl">{teamName}</p>
      {teamIdea ? <p className="mt-2 text-sm text-muted-foreground">{teamIdea}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">المعرف: {teamId}</p>
      <p className="mt-3 text-sm font-semibold text-primary">{selected ? "تم الاختيار" : "اضغط للاختيار"}</p>
    </button>
  );
}
