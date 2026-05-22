import type { ReactNode } from "react";

export function ErrorState({
  title = "حدث خطأ",
  description = "تعذر عرض المحتوى في الوقت الحالي.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center">
      <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
