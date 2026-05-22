# ARCHITECTURE

## Purpose

This document defines the mandatory architecture for this project.

It is a reusable production-grade architecture template for Next.js App Router projects that include both frontend and backend concerns.

This document is authoritative. Any implementation that violates it is rejected.

---

## Core Architecture

The project uses a hybrid architecture:

```txt
src/app        -> routing only
src/features   -> frontend feature modules only
src/server     -> backend business modules only
src/components -> shared UI components only
src/lib        -> infrastructure clients and low-level utilities only
src/shared     -> shared constants, enums, schemas, and types only
prisma         -> database schema, migrations, and seed files
docs           -> architecture, contracts, and project rules
```

---

## Required Project Structure

```txt
project-root/
  docs/
    ARCHITECTURE.md
    UI_SYSTEM.md
    DATA_TABLE_CONTRACT.md
    AUTHORIZATION.md
    FEATURE_CONTRACT.md
    PERFORMANCE.md
    AI_EXECUTION_RULES.md
    TEMPLATE_USAGE.md

  prisma/
    schema.prisma
    migrations/
    seed.ts

  public/

  src/
    app/
      layout.tsx
      globals.css
      not-found.tsx
      error.tsx

      (public)/
      (dashboard)/

      api/
        auth/
          [...nextauth]/
            route.ts
        v1/

    features/

    server/
      modules/
      core/

    components/
      ui/
      layout/
      common/

    lib/
      prisma/
      audit/
      storage/
      email/
      url/
      utils/

    shared/
      constants/
      enums/
      schemas/
      types/
```

---

## `src/app` Rules

`src/app` is for routing only.

Allowed files:

```txt
page.tsx
layout.tsx
route.ts
loading.tsx
error.tsx
not-found.tsx
template.tsx
```

Allowed responsibilities:

- define routes
- define layouts
- read `searchParams`
- call feature components
- expose API route handlers
- handle route-level loading and errors

Forbidden:

- business logic
- Prisma queries
- authorization logic
- complex UI implementation
- reusable feature components
- backend services
- validation logic except route-level parsing when unavoidable

Example:

```tsx
import { RegisterForm } from '@/features/auth/register/components/register-form';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

---

## Route Groups

Use route groups for layout separation.

```txt
src/app/(public)
src/app/(dashboard)
```

Rules:

- `(public)` contains unauthenticated pages.
- `(dashboard)` contains authenticated application pages.
- Route groups must not affect URL structure.

Example:

```txt
src/app/(public)/register/page.tsx -> /register
src/app/(dashboard)/users/page.tsx -> /users
```

---

## API Rules

All business APIs must be versioned under:

```txt
src/app/api/v1
```

Example:

```txt
/api/v1/auth/register
/api/v1/users
/api/v1/files/upload
```

Route handlers must be thin.

A route handler may:

- parse request body
- call service
- return response
- delegate errors to error handler

A route handler must not:

- use Prisma directly
- hash passwords
- implement business rules
- perform authorization directly unless calling policy/service
- contain large logic

---

## `src/features` Rules

`src/features` contains frontend feature code only.

Feature structure:

```txt
src/features/<domain>/<feature>/
  components/
  hooks/
  api/
  schemas/
  types.ts
```

Optional only when needed:

```txt
table/
constants.ts
utils.ts
```

Forbidden inside `features`:

```txt
pages/
services/
repositories/
prisma/
server logic
backend validation
database access
authorization enforcement
```

Use `api/` for frontend HTTP client functions.

Do not use `services/` in frontend features because it conflicts with backend `service.ts`.

---

## `src/server` Rules

`src/server` contains backend business logic only.

Backend feature structure:

```txt
src/server/modules/<domain>/<feature>/
  service.ts
  repository.ts
  validator.ts
  policy.ts
  workflow.ts
  types.ts
```

Responsibilities:

```txt
service.ts     -> business orchestration only
repository.ts  -> database access only
validator.ts   -> server-side Zod validation only
policy.ts      -> authorization/RBAC only
workflow.ts    -> lifecycle transitions only
types.ts       -> local backend types only
```

`workflow.ts` is required only when the feature has states or lifecycle transitions.

---

## Repository Rule

Prisma is allowed only in:

```txt
repository.ts
src/lib/prisma/client.ts
prisma/
```

Forbidden:

- Prisma in route handlers
- Prisma in React components
- Prisma in frontend features
- Prisma in services except through repository functions

---

## Service Rule

`service.ts` orchestrates business operations.

Allowed:

- call validators
- call policies
- call repositories
- call audit logger
- run transactions
- coordinate workflow transitions

Forbidden:

- raw SQL unless delegated to repository
- HTTP request handling
- UI logic
- direct response formatting
- direct component usage

---

## Policy Rule

Every protected read or mutation must pass through a policy function.

Frontend visibility is not authorization.

Middleware is not enough for sensitive operations.

---

## Audit Rule

Every mutation must create an audit log.

Mutation examples:

- create
- update
- delete
- approve
- reject
- activate
- deactivate
- assign
- upload
- archive
- status transition

Multi-step mutations must write audit logs inside the same transaction when possible.

---

## Transaction Rule

Use transactions for multi-step operations.

Required when:

- creating a record and audit log
- creating a record and related files
- changing status and writing history
- approving/rejecting workflows
- modifying permissions
- rotating tokens
- creating dependent records

---

## `src/components` Rules

Global components only.

```txt
src/components/ui      -> shadcn/ui primitives
src/components/layout  -> app shell, sidebar, header
src/components/common  -> reusable non-domain components
```

Forbidden:

- feature-specific forms
- feature-specific tables
- domain-specific business components

Correct:

```txt
src/features/auth/register/components/register-form.tsx
```

Incorrect:

```txt
src/components/register-form.tsx
```

---

## `src/lib` Rules

`src/lib` is for infrastructure and low-level utilities.

Allowed:

```txt
prisma client
audit logger
storage client
email client
URL helpers
date helpers
cn utility
```

Forbidden:

```txt
registerUser()
approveRequest()
archiveDocument()
createCorrespondence()
business workflows
```

---

## `src/shared` Rules

`src/shared` is for neutral shared definitions.

Allowed:

```txt
shared constants
shared enums
shared types
shared schemas
API response types
pagination types
route constants
permission keys
```

Forbidden:

```txt
business services
Prisma logic
React components
feature-specific logic
```

---

## Naming Rules

Use kebab-case for folders and files unless framework conventions require otherwise.

Good:

```txt
register-form.tsx
password-field.tsx
data-table-pagination.tsx
```

Bad:

```txt
RegisterForm.tsx
PasswordField.tsx
DataTablePagination.tsx
```

Component exports may use PascalCase.

---

## Dependency Rules

Do not add dependencies without explicit approval.

Allowed base stack:

```txt
Next.js
TypeScript
Prisma
Zod
Auth.js / NextAuth
bcryptjs
Tailwind CSS
shadcn/ui
lucide-react
```

Any new dependency must be justified.

---

## Stop Conditions

Stop implementation and report `ARCHITECTURE_VIOLATION_REPORT` if:

- requested code violates this architecture
- backend logic is requested inside frontend
- Prisma usage is requested outside repository
- a table is requested without the shared table system
- a mutation cannot be audited
- authorization rules are unclear
- required docs are missing
