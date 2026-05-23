import { PublicShell } from "@/components/layout/public-shell";
import { LoginScreen } from "@/features/auth/components/login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0] ?? null
    : params.callbackUrl ?? null;

  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-8">
        <LoginScreen callbackUrl={callbackUrl} />
      </main>
    </PublicShell>
  );
}
