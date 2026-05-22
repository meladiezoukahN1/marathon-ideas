import { PublicShell } from "@/components/layout/public-shell";
import { PublicVoteScreen } from "@/features/vote/components/public-vote-screen";

export default function VotePage() {
  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center py-8">
        <PublicVoteScreen />
      </main>
    </PublicShell>
  );
}
