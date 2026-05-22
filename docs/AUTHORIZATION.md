# AUTHORIZATION

## Purpose

This document defines authentication and authorization rules.

Authentication identifies the user.

Authorization determines what the user is allowed to do.

These are separate concerns.

---

## Authentication Stack

Use:

```txt
Auth.js / NextAuth
```

Required route:

```txt
src/app/api/auth/[...nextauth]/route.ts
```

This route is infrastructure only.

It must not contain business workflows.

---

## Session Rule

Session must expose only safe user data.

Allowed:

```txt
id
email
name
role/roles
permissions if needed
status
```

Forbidden:

```txt
passwordHash
tokens
sensitive metadata
internal security fields
```

---

## Middleware Rule

Use middleware for coarse route protection.

Location:

```txt
middleware.ts
```

Middleware may:

- block unauthenticated access to dashboard routes
- redirect logged-in users away from auth pages
- perform lightweight role checks
- protect route groups

Middleware must not:

- replace backend authorization
- perform heavy database queries
- implement business workflows
- approve/reject mutations
- act as the only protection for APIs

---

## Protected Routes

Dashboard routes require authentication.

Example:

```txt
/(dashboard)/*
```

Public routes:

```txt
/login
/register
/forgot-password
/reset-password
```

---

## Backend Authorization Rule

Every protected backend operation must call a policy.

Required flow:

```txt
route.ts -> service.ts -> policy.ts -> repository.ts
```

Policy location:

```txt
src/server/modules/<domain>/<feature>/policy.ts
```

---

## UI Is Not Authorization

Hiding buttons in the UI is allowed for user experience.

It is not security.

Every sensitive operation must be enforced on the server.

---

## Permission Keys

Use explicit permission keys.

Example:

```txt
users:read
users:create
users:update
users:delete

correspondence:incoming:read
correspondence:incoming:create
correspondence:incoming:update
correspondence:incoming:route
correspondence:incoming:archive

archive:records:read
archive:records:create
archive:records:update
archive:records:delete

files:upload
files:read
files:download

audit:read
```

Permission keys must be centralized:

```txt
src/shared/constants/permissions.ts
```

---

## Policy Function Rules

Policy functions must:

- accept current user/context
- check required permission
- check ownership/scope when needed
- throw controlled forbidden error
- not query unnecessary data

Example:

```ts
export function assertCanCreateUser(currentUser: CurrentUser) {
  if (!currentUser.permissions.includes('users:create')) {
    throw new ForbiddenError('Missing permission: users:create');
  }
}
```

---

## Authorization Scopes

When needed, enforce scopes:

```txt
global
department
owned
assigned
createdBy
```

Example:

A user may read only records assigned to their department unless they have global permission.

---

## API Authorization

API route handlers must not implement permission logic directly.

Correct:

```txt
route.ts calls service
service calls policy
policy validates permission
repository performs data access
```

Incorrect:

```txt
route.ts checks role manually and calls Prisma
```

---

## Account Status Rule

Inactive accounts must not access protected routes.

Forbidden statuses:

```txt
PENDING
SUSPENDED
DEACTIVATED
```

Allowed status:

```txt
ACTIVE
```

Login must be blocked for non-active accounts.

---

## Audit Rule

Authorization-sensitive mutations must write audit logs.

Examples:

- role change
- permission change
- user activation
- user suspension
- file access to confidential file
- archive status change

---

## Rejection Rules

Reject implementation if:

- API mutation has no policy check
- middleware is used as the only authorization layer
- UI visibility is treated as authorization
- permission keys are hardcoded randomly
- role checks are scattered across files
- inactive users can access protected pages
