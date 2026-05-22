# FEATURE CONTRACT

## Purpose

This document defines how frontend and backend features must be structured.

Consistency is mandatory.

---

## Feature Markdown Tracking File

Rules:

- Every feature must contain exactly one markdown tracking file.
- The file must live inside the feature folder and match the feature name.
- Examples:
  src/features/auth/login/login.md
  src/features/auth/forgot-password/forgot-password.md
  src/features/auth/reset-password/reset-password.md
  src/features/correspondence/create/create.md
- For backend-only features, if no frontend feature folder exists, place the file in:
  src/server/modules/<domain>/<feature>/<feature>.md
- Do not create multiple markdown files for the same feature.
- Do not create `notes.md`, `todo.md`, `progress.md`, `feature-log.md`, or `changelog.md`.
- Always update the existing `<feature-name>.md`.
- Create it only if missing.
- Update it after every change to that feature.
- This file tracks implementation progress only.
- The docs folder remains the architecture authority.

The tracking file must include:

- Feature name
- Purpose
- Current scope
- Out of scope
- Architecture compliance
- Files created
- Files modified
- Database impact
- Backend status
- Frontend status
- Validation performed
- Latest changes
- Remaining issues
- Next safe step

---

## Frontend Feature Structure

Required:

```txt
src/features/<domain>/<feature>/
  components/
  hooks/
  api/
  schemas/
  types.ts
```

Optional when needed:

```txt
table/
constants.ts
utils.ts
```

Do not create empty folders.

---

## Frontend Feature Responsibilities

`components/`

```txt
Feature-specific UI components only.
```

`hooks/`

```txt
Feature-specific React hooks only.
```

`api/`

```txt
Frontend HTTP client functions only.
```

`schemas/`

```txt
Client-side validation schemas only.
```

`table/`

```txt
Feature-specific table columns, filters, and query schema.
```

`types.ts`

```txt
Feature-local frontend types.
```

---

## Frontend Forbidden Items

Forbidden inside `src/features`:

```txt
pages/
services/
repositories/
prisma/
server-only logic
database access
backend authorization
global shared UI
```

---

## Backend Feature Structure

Required:

```txt
src/server/modules/<domain>/<feature>/
  service.ts
  repository.ts
  validator.ts
  policy.ts
  types.ts
```

Optional:

```txt
workflow.ts
```

`workflow.ts` is required only when the feature has state transitions.

---

## Backend File Responsibilities

### `service.ts`

Allowed:

- business orchestration
- transaction coordination
- calling validator
- calling policy
- calling repository
- calling audit logger
- calling workflow

Forbidden:

- Prisma direct access
- HTTP response formatting
- React code
- raw UI logic

---

### `repository.ts`

Allowed:

- Prisma queries
- database reads
- database writes
- database filtering
- database pagination

Forbidden:

- business decisions
- authorization decisions
- HTTP logic
- UI logic

---

### `validator.ts`

Allowed:

- server-side Zod schemas
- input validation
- query validation

Forbidden:

- database calls
- authorization
- mutation execution

---

### `policy.ts`

Allowed:

- permission checks
- role checks
- scope checks
- ownership checks

Forbidden:

- UI checks
- database mutation
- workflow transitions

---

### `workflow.ts`

Allowed:

- state transition validation
- allowed transitions map
- lifecycle invariants

Example:

```txt
DRAFT -> SUBMITTED -> APPROVED -> CLOSED
```

Forbidden:

- database writes
- HTTP responses
- UI behavior

---

## Page Composition Rule

Pages must be thin.

Example:

```tsx
import { UsersView } from '@/features/users/list/components/users-view';

export default function UsersPage() {
  return <UsersView />;
}
```

---

## API Client Rule

Frontend API clients live in:

```txt
src/features/<domain>/<feature>/api/
```

Example:

```txt
register.api.ts
users.api.ts
incoming-correspondence.api.ts
```

They may call `fetch`.

They must not import backend repositories or Prisma.

---

## Shared Logic Rule

If logic is used by more than one feature, move it to one of:

```txt
src/components/common
src/shared
src/lib
```

Do not duplicate.

---

## Rejection Rules

Reject implementation if:

- feature contains `pages/`
- feature contains backend services
- feature uses Prisma
- route page contains large UI logic
- route handler contains business logic
- shared UI is duplicated in features
- empty folders are created without need
