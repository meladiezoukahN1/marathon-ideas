export type AuditActionValue =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "TEAM_UPDATED"
  | "PHASE_CHANGED"
  | "TIMER_CHANGED"
  | "VOTING_OPENED"
  | "VOTING_CLOSED"
  | "RESULT_CALCULATED"
  | "RESULT_SHOWN"
  | "TIE_RESOLVED"
  | "DISPLAY_MODE_CHANGED";

export interface CreateAuditLogInput {
  actorId?: string | null;
  action: AuditActionValue;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogCreateResult {
  id: string;
}
