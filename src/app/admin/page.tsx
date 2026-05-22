import { AdminShell } from "@/components/layout/admin-shell";
import { AdminControlScreen } from "@/features/admin-control/components/admin-control-screen";

export default function AdminPage() {
  return (
    <AdminShell>
      <main className="mx-auto w-full max-w-6xl flex-1 py-4 sm:py-6">
        <AdminControlScreen />
      </main>
    </AdminShell>
  );
}
