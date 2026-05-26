# COPILOT REPAIR PROMPT — Marathon V3 Full Project

You are working on the existing `marathon-v3-full-project` codebase reconstructed from Claude-generated snippets.

Do not rewrite the project from scratch. Repair it in place.

## Goal

Make the project install, typecheck, build, migrate, seed, and run locally.

## Validate with

```bash
npm install
npx prisma generate
npm run typecheck
npm run build
```

If MySQL is available:

```bash
cp .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Inspect and fix first

1. Confirm `server.ts` exists and matches `package.json` scripts.
2. Confirm all imports reference existing files.
3. Fix incomplete/truncated generated files.
4. Fix TypeScript errors without changing business rules.
5. Fix Prisma schema/seed/runtime errors.
6. Fix Socket.IO initialization.
7. Fix public and jury voting guards.

## Business rules

- Event contains Challenges.
- Each Challenge has TEAM1 and TEAM2.
- Phases: WAITING, PRESENTING, VOTING, RESULT.
- Voting only during VOTING.
- Jury vote weight: 60%.
- Public vote weight: 40%.
- Duplicate public vote returns ALREADY_VOTED.
- Duplicate jury vote returns ALREADY_VOTED.
- Jury vote must verify selected team belongs to the challenge.

## Final report

Return:
1. Files created.
2. Files modified.
3. Bugs found.
4. Bugs fixed.
5. Commands executed.
6. Remaining risks.
7. Exact run commands.
