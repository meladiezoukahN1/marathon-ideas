import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth/options";
import { UnauthorizedError } from "./errors";

export interface CurrentUser {
  id: string;
  role: UserRole;
}

// Overloads allow callers to express whether authentication is required.
// getCurrentUser()       → CurrentUser | null  (unauthenticated callers get null)
// getCurrentUser(true)   → CurrentUser          (throws if not authenticated)
export async function getCurrentUser(): Promise<CurrentUser | null>;
export async function getCurrentUser(required: true): Promise<CurrentUser>;
export async function getCurrentUser(required?: boolean): Promise<CurrentUser | null> {
  // In next-auth v5, auth() reads from the request context automatically
  // when called from within App Router route handlers or server components.
  const session = await auth();

  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (!userId || !userRole) {
    if (required) {
      throw new UnauthorizedError("Not authenticated");
    }
    return null;
  }

  return { id: userId, role: userRole };
}
