# AI EXECUTION RULES

## Purpose

This document defines mandatory rules for AI coding agents.

The AI must obey this project architecture exactly.

---

## Required Reading Before Code

Before writing or modifying code, read:

```txt
docs/ARCHITECTURE.md
docs/UI_SYSTEM.md
docs/DATA_TABLE_CONTRACT.md
docs/AUTHORIZATION.md
docs/FEATURE_CONTRACT.md
docs/PERFORMANCE.md
```

If any file is missing, stop and report:

```txt
MISSING_ARCHITECTURE_DOCS_REPORT
```

---

## Mandatory File Inspection Before Changes

Rules:

- Before modifying, generating, deleting, or refactoring any code, inspect the relevant existing files.
- Read AGENTS.md.
- Read required architecture docs.
- Inspect related source files.
- Inspect Prisma models if database behavior is involved.
- Inspect API routes if backend behavior is involved.
- Inspect frontend feature files if UI behavior is involved.
- Inspect shared components if reusable UI is involved.
- Produce a short implementation plan before editing.
- If relevant files cannot be inspected, stop and report: `INSPECTION_REQUIRED_REPORT`.

---

## Non-Negotiable Rules

The AI must not:

- bypass the project architecture
- invent alternative structure
- create pages inside features
- place backend logic inside features
- use Prisma outside repository.ts
- write raw table markup
- duplicate pagination/search/filter logic
- hardcode colors
- skip server-side validation
- skip authorization policy checks
- skip audit logs for mutations
- add dependencies without explicit approval
- create empty folders without need
- implement unrelated features
- use mock/demo shortcuts in production code

---

## Required Implementation Flow

For any task:

1. Identify affected domain and feature.
2. Check required docs.
3. Locate correct layer.
4. Modify only required files.
5. Keep route/page files thin.
6. Reuse shared components.
7. Enforce validation.
8. Enforce authorization where needed.
9. Add audit logs for mutations.
10. Run typecheck when possible.
11. Report files changed and remaining issues.

---

## Table Rule

If the task includes a table:

- use `src/components/common/data-table`
- use URL query state
- support pagination
- support search
- support filters
- parse `searchParams`
- do not write custom raw tables

If the shared DataTable does not exist, create it first.

---

## UI Rule

If the task includes UI:

- use shadcn/ui primitives
- use semantic tokens from globals.css
- do not hardcode colors
- support dark mode
- keep typography consistent
- do not place feature-specific components in global components

---

## Backend Rule

If the task includes backend logic:

Use:

```txt
route.ts -> service.ts -> validator.ts -> policy.ts -> repository.ts
```

Prisma is allowed only in `repository.ts`.

---

## Auth Rule

If the task touches authentication or authorization:

- use NextAuth/Auth.js for authentication
- use middleware for coarse route protection
- use policy.ts for backend authorization
- never rely on UI hiding only

---

## Audit Rule

If the task includes a mutation:

- create audit log
- use transaction when mutation has multiple writes
- do not mutate data silently

---

## Stop Conditions

Stop and report `ARCHITECTURE_VIOLATION_REPORT` if:

- user request conflicts with architecture
- required shared component is missing and cannot be created safely
- permission rules are unclear
- mutation cannot be audited
- data ownership/scope is unclear
- implementation would require a new dependency without approval
- task requires changing schema without explicit instruction

---

## Required Final Report

After implementation, report:

```txt
Files created
Files modified
Architecture rules followed
Validation added
Authorization added
Audit added
Typecheck/build result
Remaining issues
```

Do not hide errors.

Do not claim success if typecheck fails.
