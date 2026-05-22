interface VoteTeamCardProps {
  title: string;
  teamId: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (teamId: string) => void;
}

export function VoteTeamCard({
  title,
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
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-bold text-card-foreground sm:text-xl">{teamId}</p>
      <p className="mt-3 text-sm font-semibold text-primary">{selected ? "تم الاختيار" : "اضغط للاختيار"}</p>
    </button>
  );
}
