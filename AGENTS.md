# AGENTS.md

Before writing code, read:

- docs/CONTEXT_PRODUCTION_v3.md
- docs/SESSION_1_FOUNDATION_PRODUCTION_PROMPT.md
- docs/ARCHITECTURE.md
- docs/UI_SYSTEM.md
- docs/DATA_TABLE_CONTRACT.md
- docs/AUTHORIZATION.md
- docs/FEATURE_CONTRACT.md
- docs/PERFORMANCE.md
- docs/AI_EXECUTION_RULES.md
- docs/TEMPLATE_USAGE.md

Do not use files under:

- docs/legacy/

Legacy files are archived for reference only and are not implementation authority.

Canonical backend flow:

route.ts -> service.ts -> validator.ts -> policy.ts -> repository.ts

Rules:
- src/app is routing only.
- src/features is frontend only.
- src/server is backend only.
- src/components is shared UI only.
- src/lib is infrastructure only.
- src/shared is shared constants/types/schemas only.
- Prisma is allowed only in repository.ts, src/lib/prisma/client.ts, and prisma/.
- No business logic in route handlers.
- No Prisma in React components.
- No hardcoded jury count.
- No raw IP storage.
- No automatic winner on tie.
- Every mutation must be audited.
- Every protected operation must use policy.ts.
- Every input must be validated.

If implementation conflicts with docs, stop and report:

ARCHITECTURE_VIOLATION_REPORT