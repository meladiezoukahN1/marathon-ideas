interface VotingControlProps {
  matchId: string | null;
  disabled?: boolean;
  onOpen: (matchId: string) => void;
  onClose: (matchId: string) => void;
}

export function VotingControl({
  matchId,
  disabled = false,
  onOpen,
  onClose,
}: VotingControlProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-black text-card-foreground">التحكم في التصويت</h2>
      {matchId ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onOpen(matchId)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            فتح التصويت
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onClose(matchId)}
            className="rounded-xl border border-destructive bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            إغلاق التصويت
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لا يوجد نزال حالي للتحكم في التصويت.</p>
      )}
    </section>
  );
}
