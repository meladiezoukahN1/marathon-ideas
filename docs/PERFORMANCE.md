# PERFORMANCE

## Purpose

This document defines mandatory performance rules.

Performance is part of production readiness.

---

## Server Components Rule

Use Server Components by default.

Use Client Components only when required for:

- form interaction
- local state
- browser APIs
- event handlers
- client-side animations
- controlled inputs
- interactive tables

Do not add `"use client"` at page level unless unavoidable.

---

## Client Component Rule

Client Components must be small.

Forbidden:

- making entire page client-side unnecessarily
- fetching large datasets in client components
- duplicating server-fetched data
- using client state for data that belongs in URL

---

## Data Fetching Rule

Fetch data on the server when possible.

Avoid duplicate fetching.

Do not fetch the same data in parent and child.

---

## Table Performance

All tables must use pagination.

Forbidden:

```txt
return all records
load all rows into browser
filter huge lists on client
```

Required:

```txt
server-side pagination
server-side filtering
server-side search
server-side sorting when needed
```

---

## API Performance

All list endpoints must support:

```txt
page
pageSize
search
filters
sort
```

All list endpoints must enforce maximum `pageSize`.

Recommended max:

```txt
100
```

---

## Database Performance

Required:

- select only required fields
- avoid N+1 queries
- add indexes for frequently searched fields
- add indexes for filtered fields
- add indexes for foreign keys
- use transactions only where needed
- avoid large JSON payloads

---

## Prisma Rules

Do not use broad includes unnecessarily.

Bad:

```ts
include: {
  user: true,
  files: true,
  logs: true,
}
```

Good:

```ts
select: {
  id: true,
  title: true,
  createdAt: true,
}
```

---

## Search Performance

Search must be bounded.

Rules:

- trim search input
- limit result size
- index searchable fields when possible
- do not perform expensive search on every render
- debounce client search when updating URL

---

## Rendering Rules

Avoid:

- unnecessary state
- duplicated derived state
- expensive computations inside render
- large inline arrays
- unstable objects passed deeply
- unnecessary context providers

Use memoization only when it solves a measured or obvious re-render problem.

---

## Bundle Rules

Do not import heavy libraries into global layouts.

Use dynamic imports for heavy optional components.

Avoid adding large dependencies for small tasks.

---

## Images and Files

Use optimized image handling when applicable.

Do not render large files directly in lists.

Use previews, metadata, and lazy loading.

---

## Forms

Do not re-render full pages for small form changes.

Keep interactive form components isolated.

Use server validation regardless of client validation.

---

## High-Volume Vote Path

Public vote submission is a high-throughput path.

Rules:

- do not add duplicate writes
- do not add per-vote AuditLog writes for PublicVote/JuryVote
- keep vote write path minimal and indexed
- this is a deliberate throughput safeguard, not a missing audit

---

## Rejection Rules

Reject implementation if:

- it loads unbounded lists
- it makes page-level client components unnecessarily
- it fetches duplicate data
- it ignores pagination
- it returns excessive fields
- it introduces heavy dependencies without approval
- it uses client-side filtering for large server data
