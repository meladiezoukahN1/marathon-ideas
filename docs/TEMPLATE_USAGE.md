# TEMPLATE USAGE

## Purpose

This docs pack is a reusable production architecture template.

Use it for any serious Next.js App Router project that contains frontend and backend code.

---

## How To Use

Copy these files into the new project:

```txt
docs/ARCHITECTURE.md
docs/UI_SYSTEM.md
docs/DATA_TABLE_CONTRACT.md
docs/AUTHORIZATION.md
docs/FEATURE_CONTRACT.md
docs/PERFORMANCE.md
docs/AI_EXECUTION_RULES.md
AGENTS.md
```

Optional:

```txt
.github/copilot-instructions.md
CLAUDE.md
.cursor/rules/
```

---

## First AI Prompt

Use this prompt when starting a project:

```txt
Read AGENTS.md and all files inside docs/.

Initialize the project using the documented architecture only.

Do not invent a different structure.

Start with the minimum production foundation:
- Next.js App Router
- TypeScript strict
- Tailwind
- shadcn/ui
- Prisma
- Zod
- Auth.js/NextAuth-compatible structure
- src/app
- src/features
- src/server
- src/components
- src/lib
- src/shared

Do not implement unrelated features.

If any architecture document is missing or conflicting, stop and produce MISSING_ARCHITECTURE_DOCS_REPORT.
```

---

## What To Customize Per Project

Update:

```txt
project name
business domains
permission keys
status enums
design colors
API route names
database models
```

Do not change the core architecture unless there is a strong reason.
