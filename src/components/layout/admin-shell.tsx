import type { ReactNode } from "react";

import { AppShell } from "./app-shell";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </AppShell>
  );
}
