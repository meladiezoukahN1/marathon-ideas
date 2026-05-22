# DATA TABLE CONTRACT

## Purpose

This document defines the mandatory table system.

Any page that displays tabular data must follow this contract.

---

## Core Rule

Do not build raw tables inside features.

All tables must use the shared DataTable system.

Required location:

```txt
src/components/common/data-table/
```

---

## Required Shared Table Structure

```txt
src/components/common/data-table/
  data-table.tsx
  data-table-toolbar.tsx
  data-table-search.tsx
  data-table-filter.tsx
  data-table-pagination.tsx
  data-table-empty-state.tsx
  data-table-loading.tsx
  data-table-view-options.tsx
  data-table.types.ts
```

Optional:

```txt
data-table-column-header.tsx
data-table-row-actions.tsx
```

---

## Required Table Features

Every table must support:

```txt
pagination
search
filters
URL query state
SSR-compatible parsing
loading state
empty state
```

Sorting is recommended when useful.

---

## URL State Rule

Table state must be stored in URL query params.

Example:

```txt
/products?page=2&pageSize=20&search=laptop&status=ACTIVE&size=small
```

Required base params:

```txt
page
pageSize
search
sort
```

Feature-specific params are allowed:

```txt
status
type
priority
dateFrom
dateTo
departmentId
```

---

## SSR Rule

Pages with tables must read `searchParams` at page level.

Example:

```tsx
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const query = productTableQuerySchema.parse(rawParams);

  return <ProductsView query={query} />;
}
```

---

## Query Schema Rule

Base table schema:

```txt
src/shared/schemas/table-query.schema.ts
```

Feature-specific table schema:

```txt
src/features/<domain>/<feature>/table/<feature>-query.schema.ts
```

Example:

```ts
import { z } from 'zod';
import { baseTableQuerySchema } from '@/shared/schemas/table-query.schema';

export const productTableQuerySchema = baseTableQuerySchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  color: z.string().optional(),
  size: z.string().optional(),
});
```

---

## Feature Table Structure

Each feature may define:

```txt
src/features/<domain>/<feature>/table/
  columns.tsx
  filters.ts
  query.schema.ts
```

Feature tables must not redefine:

- pagination UI
- search UI
- filter shell
- table base layout
- empty state
- loading state

---

## Data Fetching Rule

List endpoints must support:

```txt
page
pageSize
search
filters
sort
```

List endpoints must return:

```ts
{
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

Do not return unbounded lists.

---

## Navigation Rule

Old query params must not leak between routes or tabs.

Each page owns its allowed query params.

If the current route does not support a query param, it must be ignored or stripped.

Required utility:

```txt
src/lib/url/clean-route-query.ts
```

---

## Client Interaction Rule

When users change:

- page
- page size
- search
- filters
- sorting

the URL must update.

Do not store table source-of-truth only in React state.

React state may be used temporarily for input debounce, but final state must be reflected in URL.

---

## Search Rule

Search input should debounce URL updates when client-side interaction is used.

Recommended debounce:

```txt
300ms - 500ms
```

Search must reset page to `1`.

---

## Filter Rule

Changing filters must reset page to `1`.

Filters must use explicit keys.

Bad:

```txt
?filter=color&value=red
```

Good:

```txt
?color=red
```

For multiple values:

```txt
?status=ACTIVE,SUSPENDED
```

or repeated params if the project standard allows it.

The chosen standard must be consistent.

---

## Pagination Rule

Pagination must be shared.

Required behavior:

- next page
- previous page
- first page when useful
- last page when useful
- page size selector
- disabled state
- URL update

---

## Table Rejection Rules

Reject implementation if:

- it writes raw table markup in feature page
- pagination is duplicated
- search is duplicated
- filters are duplicated
- table state is not reflected in URL
- endpoint returns unbounded data
- feature bypasses shared DataTable
