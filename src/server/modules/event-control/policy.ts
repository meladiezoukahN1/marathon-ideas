import { ForbiddenError } from "@/server/core/errors";
import type { CurrentUser } from "@/server/core/session";
import { isAdminRole } from "@/shared/constants/permissions";

export function assertCanManageEventControl(actor: CurrentUser): void {
  if (!isAdminRole(actor.role)) {
    throw new ForbiddenError("Only ADMIN or SUPERADMIN can control event display mode");
  }
}
