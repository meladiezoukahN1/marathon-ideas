# UI SYSTEM

## Purpose

This document defines the mandatory UI system for all frontend implementation.

The goal is consistency, maintainability, dark mode support, and design scalability.

---

## Core Rule

All visual styling must use semantic design tokens from:

```txt
src/app/globals.css
```

Do not hardcode raw colors.

---

## Forbidden Color Usage

Forbidden:

```tsx
className="bg-blue-600 text-white border-gray-200"
className="bg-[#0f172a]"
style={{ color: '#000' }}
```

Allowed:

```tsx
className="bg-primary text-primary-foreground border-border"
className="bg-card text-card-foreground"
className="text-muted-foreground"
```

---

## Required Semantic Tokens

The system must support these tokens:

```txt
background
foreground
card
card-foreground
popover
popover-foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
accent
accent-foreground
destructive
destructive-foreground
border
input
ring
radius
```

---

## `globals.css` Responsibility

`globals.css` defines:

- color tokens
- dark mode tokens
- radius tokens
- base typography
- base background
- base foreground
- reusable CSS variables

It must not contain feature-specific styling.

Forbidden:

```css
.employee-card {}
.incoming-table {}
.archive-form {}
```

Feature styling belongs in Tailwind classes inside feature components, using semantic tokens only.

---

## shadcn/ui Rule

Use shadcn/ui primitives as the UI foundation.

Allowed:

```txt
Button
Input
Textarea
Select
Dialog
DropdownMenu
Card
Table
Badge
Alert
Skeleton
Sheet
Tabs
Form
```

Do not use raw third-party UI components directly inside features.

If a third-party component is required, wrap it inside a controlled shared component first.

---

## Component Placement

Shared primitive:

```txt
src/components/ui/button.tsx
```

Shared non-domain component:

```txt
src/components/common/data-table/data-table.tsx
```

Layout component:

```txt
src/components/layout/app-sidebar.tsx
```

Feature-specific component:

```txt
src/features/<domain>/<feature>/components/
```

---

## Typography Rules

Use consistent Tailwind text scale.

```txt
Page title       -> text-2xl or text-3xl
Section title    -> text-xl
Card title       -> text-base or text-lg
Body text        -> text-sm or text-base
Meta/helper text -> text-xs or text-sm text-muted-foreground
```

Forbidden:

- random text sizes without hierarchy
- inconsistent font weights
- excessive bold text
- decorative typography in admin systems

---

## Spacing Rules

Use Tailwind spacing scale.

Recommended:

```txt
Page container -> space-y-6
Card content   -> p-4 or p-6
Form fields    -> space-y-4
Sections       -> gap-4 or gap-6
Tables         -> gap-3 or gap-4
```

Avoid arbitrary values unless there is a strong design reason.

Forbidden:

```tsx
className="p-4.25 gap-3.25"
```

Allowed when justified:

```tsx
className="rounded-[1.25rem]"
```

---

## Radius Rules

Use project radius tokens where possible.

Preferred:

```txt
rounded-lg
rounded-xl
rounded-2xl
```

Avoid inconsistent radius values across similar components.

---

## Dark Mode

Dark mode must work through CSS variables.

Forbidden:

```tsx
className="bg-white dark:bg-black"
```

Allowed:

```tsx
className="bg-background text-foreground"
className="bg-card text-card-foreground"
```

Use manual dark variants only when semantic tokens cannot express the state.

---

## Forms

All forms must use:

- clear labels
- visible errors
- disabled/loading state
- server-side validation
- accessible inputs
- semantic tokens
- consistent spacing

Required structure:

```txt
Form container
Form field
Label
Input
Error message
Submit button
Loading state
```

---

## Empty States

All empty states must use shared component when possible:

```txt
src/components/common/empty-state.tsx
```

Empty states must include:

- short title
- optional description
- optional action

---

## Loading States

Use `Skeleton` for structured loading.

Forbidden:

- layout shifting
- random spinners everywhere
- full-page loading when only one section is loading

---

## Badges and Status

Status UI must use controlled mappings.

Do not hardcode status label/color inside pages.

Use:

```txt
features/<domain>/<feature>/constants.ts
```

or shared status mapping if global.

---

## Accessibility

Required:

- buttons must have accessible labels when icon-only
- inputs must have labels
- dialogs must have titles
- focus states must remain visible
- do not remove outlines without replacement
- use semantic HTML where possible

---

## RTL Support

Arabic projects must support RTL.

Required:

```txt
<html lang="ar" dir="rtl">
```

Layouts and components must not assume LTR spacing.

Use logical layout patterns where possible.

---

## UI Rejection Rules

Reject implementation if it:

- hardcodes colors
- bypasses shadcn/ui primitives
- duplicates shared components
- creates feature-specific UI inside global components
- breaks dark mode
- uses inconsistent typography
- uses raw table markup instead of DataTable
