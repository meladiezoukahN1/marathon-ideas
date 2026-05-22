import type { UserRole } from "@prisma/client";

// Centralized role constants — required by docs/AUTHORIZATION.md.
// All policy functions must import from here; do not use role string literals
// directly in policy files.

export const ADMIN_ROLES: readonly string[] = ["ADMIN", "SUPERADMIN"];
export const SUPERADMIN_ONLY: readonly string[] = ["SUPERADMIN"];
export const JURY_ROLE: readonly string[] = ["JURY"];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isSuperadmin(role: UserRole): boolean {
  return role === "SUPERADMIN";
}

export function isJuryRole(role: UserRole): boolean {
  return role === "JURY";
}
