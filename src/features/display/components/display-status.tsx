interface DisplayStatusProps {
  modeLabel: string;
  subLabel?: string;
}

export function DisplayStatus({ modeLabel, subLabel }: DisplayStatusProps) {
  return (
    <header className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-6 py-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">شاشة العرض</p>
      <div className="text-left">
        <p className="text-lg font-bold text-card-foreground sm:text-2xl">{modeLabel}</p>
        {subLabel ? <p className="text-sm text-muted-foreground">{subLabel}</p> : null}
      </div>
    </header>
  );
}
