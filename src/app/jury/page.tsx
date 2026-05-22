import { PublicShell } from "@/components/layout/public-shell";
import { JuryVoteScreen } from "@/features/jury/components/jury-vote-screen";

export default function JuryPage() {
  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center py-8">
        <JuryVoteScreen />
      </main>
    </PublicShell>
  );
}
