"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/common/error-state";

import {
  getSafeInternalCallbackUrl,
  getSessionRoleWithRetry,
  resolveRoleRedirect,
  signInWithCredentials,
} from "../lib/auth-client";

export function LoginScreen({ callbackUrl }: { callbackUrl: string | null }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeCallbackUrl = useMemo(() => {
    return getSafeInternalCallbackUrl(callbackUrl);
  }, [callbackUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await signInWithCredentials({
        username: trimmedUsername,
        password,
      });

      if (!result.ok) {
        setError("بيانات الدخول غير صحيحة. تحقق من اسم المستخدم وكلمة المرور.");
        setSubmitting(false);
        return;
      }

      const role = await getSessionRoleWithRetry();
      const fallback = resolveRoleRedirect(role);
      const destination = safeCallbackUrl ?? fallback;

      router.replace(destination);
      router.refresh();
    } catch {
      setError("تعذر تسجيل الدخول حالياً. حاول مرة أخرى.");
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-muted-foreground">لوحة الإدارة ولجنة التحكيم</p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-card-foreground">
            اسم المستخدم
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
            disabled={submitting}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 transition-shadow focus:border-ring focus:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-card-foreground">
            كلمة المرور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            disabled={submitting}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 transition-shadow focus:border-ring focus:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        {error ? (
          <ErrorState
            title="تعذر تسجيل الدخول"
            description={error}
          />
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl border border-border bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "جاري تسجيل الدخول..." : "دخول"}
        </button>
      </form>
    </section>
  );
}
