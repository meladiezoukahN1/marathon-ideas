interface JuryTeamCardProps {
  label: string;
  teamId: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (teamId: string) => void;
}

export function JuryTeamCard({
  label,
  teamId,
  selected,
  disabled = false,
  onSelect,
}: JuryTeamCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(teamId)}
      className="w-full rounded-2xl border border-border bg-card px-5 py-6 text-right shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      aria-pressed={selected}
    >
      <p className="text-base font-bold text-card-foreground sm:text-xl">{label}</p>
      <p className="mt-2 text-xs text-muted-foreground">المعرف: {teamId}</p>
      <p className="mt-3 text-sm font-semibold text-primary">{selected ? "تم الاختيار" : "اضغط للاختيار"}</p>
    </button>
  );
}
