import { ForbiddenError } from "../../core/errors";
import type { CurrentUser } from "../../core/session";
import { isAdminRole } from "../../../shared/constants/permissions";

export function assertCanControlMatch(actor: CurrentUser): void {
  if (!isAdminRole(actor.role)) {
    throw new ForbiddenError("Only ADMIN or SUPERADMIN can control matches");
  }
}
