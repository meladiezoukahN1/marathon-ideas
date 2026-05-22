export function LoadingState({ label = "جاري التحميل" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
