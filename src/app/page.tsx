import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16 sm:px-10 lg:px-12">
        <section className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
          <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Marathon Ideas
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
            نظام مسابقات حي للأفكار الريادية
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            منصة عربية بتخطيط RTL لدعم العرض، التصويت، والتحكم الإداري في حدث مباشر.
          </p>
          <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/60 px-6 py-4 text-sm font-medium text-foreground">
            النظام قيد التجهيز
          </div>

          <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="روابط الصفحات">
            <Link
              href="/display"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              شاشة العرض
            </Link>
            <Link
              href="/vote"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              التصويت العام
            </Link>
            <Link
              href="/jury"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              تصويت لجنة التحكيم
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              لوحة التحكم
            </Link>
          </nav>
        </section>
      </main>
    </AppShell>
  );
}