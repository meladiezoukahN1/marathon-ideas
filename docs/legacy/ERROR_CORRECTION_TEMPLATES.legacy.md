# AGENT ERROR CORRECTION TEMPLATES
# ══════════════════════════════════
# Use these when the agent produces incorrect code.
# Copy the relevant template and fill in [brackets].

---

## TEMPLATE A: TypeScript Error Fix

```
The code in [FILE_PATH] has TypeScript errors:

Error: [paste exact error message from tsc output]

Rules from CONTEXT.md that apply:
- Zero `any` types — use `unknown` with type guards
- All function parameters and returns must be explicitly typed

Fix ONLY [FILE_PATH]. Do not change any other file.
Show the complete corrected file.
```

---

## TEMPLATE B: Logic Violation Fix

```
The code in [FILE_PATH] violates CONTEXT.md rule: [STATE THE RULE].

Specific violation: [DESCRIBE WHAT IS WRONG].

Example of the wrong pattern you used:
[paste the wrong code]

The correct pattern according to CONTEXT.md:
[describe what it should be]

Rewrite [FILE_PATH] with this fix. Do not change anything else.
```

---

## TEMPLATE C: Missing Constraint Fix

```
The code you wrote is missing these required constraints from CONTEXT.md:

1. [MISSING CONSTRAINT 1] — found in CONTEXT.md Section [N]
2. [MISSING CONSTRAINT 2] — found in CONTEXT.md Section [N]

Specifically in [FILE_PATH], these are missing:
- [describe what's absent]

Add the missing constraints. Show only the changed sections.
```

---

## TEMPLATE D: Performance Issue Fix

```
The code in [FILE_PATH] has a performance problem:

Problem: [DESCRIBE THE ISSUE]
Impact: [WHY IT MATTERS — e.g., "causes unnecessary re-renders on every timer tick"]

The correct approach per CONTEXT.md Section 10:
- [correct approach]

Refactor [FILE_PATH] to fix this.
```

---

## TEMPLATE E: Session Context Recovery

```
You seem to have lost context. Here is a summary:

PROJECT: Marathon Ideas — real-time tournament bracket for startup pitches
STACK: Next.js 14 + TypeScript strict + MySQL + Prisma + Socket.IO + Tailwind + Framer Motion

CURRENT SESSION: [SESSION NUMBER AND NAME]
ALREADY BUILT (do not rebuild):
- Session 1: prisma/schema.prisma, src/lib/prisma.ts, src/lib/vote-calc.ts, types/socket.types.ts, server.ts
- Session 2: src/app/api/vote/route.ts, src/app/api/match/route.ts, src/app/api/admin/route.ts, all hooks, all stores
- Session 3: [list if completed]

CURRENT TASK: [describe what you need now]

Re-read CONTEXT.md and continue from where we were.
```

---

## TEMPLATE F: Code Review Before Proceeding

```
Before we move to Session [N], review the code you wrote in Session [N-1]:

Check each item and report status (OK / ISSUE):

□ 1. Zero `any` types in all files
□ 2. Every async function has try/catch
□ 3. Every Prisma query uses `select` (no bare findMany/findFirst)
□ 4. All Socket.IO emits use typed events from types/socket.types.ts
□ 5. No business logic inside API route handlers (all in src/lib/actions/)
□ 6. Every function is under 30 lines
□ 7. pino logger used (no console.log)
□ 8. Zod validation on all API inputs
□ 9. Auth check on all /api/admin routes
□ 10. [SESSION-SPECIFIC CHECK]

For each ISSUE found: show the file, the problem, and the fix.
```

---

## TEMPLATE G: Stack Deviation Correction

```
You added [LIBRARY/PATTERN] which is NOT in the approved stack.

CONTEXT.md Section 2 defines the stack. Every addition must be justified.

Remove [LIBRARY/PATTERN] and replace with the approved alternative:
- Instead of [what agent used], use [approved alternative]

The correct implementation:
[describe it]
```

---

## QUICK CHECKS (run these after each session)

### After Session 1:
```bash
npx tsc --noEmit                    # Zero TypeScript errors
npx prisma validate                 # Schema valid
npm run db:migrate                  # Migration runs clean
npm run test                        # vote-calc tests pass
node -e "require('./src/lib/prisma')" # Prisma client initializes
```

### After Session 2:
```bash
npm run dev                         # Server starts without errors
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"matchId":"invalid","teamId":"invalid","voterToken":"test"}' \
  # Should return 400 with Zod validation error
curl http://localhost:3000/api/match?eventId=xxx
  # Should return bracket structure
```

### After Session 3:
```bash
npm run dev
# Open http://localhost:3000/display  — bracket visible
# Open http://localhost:3000/admin    — redirects to login
# Open http://localhost:3000/vote/xxx — shows closed state
# No console errors in browser
# No TypeScript errors: npx tsc --noEmit
```

### After Session 4:
```bash
npm run build                       # Production build succeeds
# Check bundle: next bundle analyzer
# canvas-confetti must NOT be in main bundle
# Verify: window.matchMedia('(prefers-reduced-motion: reduce)') respected
```
