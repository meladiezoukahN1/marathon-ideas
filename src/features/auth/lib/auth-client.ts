import { getSession, signIn } from "next-auth/react";

import type { AuthRole, LoginFormInput, LoginSubmitResult } from "../types";

function isAbsoluteUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
}

export function getSafeInternalCallbackUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/api/")) {
    return null;
  }

  if (isAbsoluteUrl(value)) {
    return null;
  }

  return value;
}

export function resolveRoleRedirect(role: AuthRole | null | undefined): string {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return "/admin";
  }

  if (role === "JURY") {
    return "/jury";
  }

  return "/";
}

export async function signInWithCredentials(input: LoginFormInput): Promise<LoginSubmitResult> {
  const result = await signIn("credentials", {
    username: input.username,
    password: input.password,
    redirect: false,
  });

  if (!result || result.error) {
    return { ok: false, error: result?.error ?? "CredentialsSignin" };
  }

  return { ok: true };
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getSessionRoleWithRetry(): Promise<AuthRole | null> {
  const maxAttempts = 4;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession();
    const role = session?.user?.role;

    if (role === "ADMIN" || role === "SUPERADMIN" || role === "JURY") {
      return role;
    }

    if (attempt < maxAttempts - 1) {
      await wait(150);
    }
  }

  return null;
}
