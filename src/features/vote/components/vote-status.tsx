interface VoteStatusProps {
  title: string;
  subtitle?: string;
}

export function VoteStatus({ title, subtitle }: VoteStatusProps) {
  return (
    <header className="rounded-2xl border border-border bg-card px-5 py-4 text-center">
      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">التصويت العام</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-card-foreground sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </header>
  );
}
