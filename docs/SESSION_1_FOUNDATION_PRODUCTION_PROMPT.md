# SESSION 1 — Production Foundation, Database, Auth, Voting Math & Contracts

## AUTHORITY RULE

- This session must read `docs/CONTEXT_PRODUCTION_v3.md` first.
- Root `CONTEXT.md` is legacy and non-authoritative.
- If any instruction conflicts with `docs/CONTEXT_PRODUCTION_v3.md`, the production context wins.
- If any instruction conflicts with `docs/ARCHITECTURE.md`, stop and report `ARCHITECTURE_CONFLICT_REPORT`.

You are a senior Next.js + Prisma + TypeScript engineer.

Read `docs/CONTEXT_PRODUCTION_v3.md` completely before writing code.
Every decision in `docs/CONTEXT_PRODUCTION_v3.md` is final.
Do not deviate.
Do not implement UI in this session.
Do not implement Socket.IO server in this session.
Do not implement full admin dashboard in this session.

Your job is to build the production foundation and backend contracts only.

---

# SESSION GOALS

1. Create project foundation files.
2. Create production Prisma schema.
3. Create seed data for fixed challenges, teams, matches, and superadmin.
4. Implement Prisma singleton.
5. Implement logger.
6. Implement final vote calculation logic.
7. Implement anti-duplicate public vote helpers.
8. Implement core domain/API/socket types.
9. Implement NextAuth credentials auth.
10. Add tests for voting math and duplicate checks.
11. Ensure the codebase typechecks and tests pass.

---

# BUILD THESE FILES ONLY

## 1. package.json

Use dependencies from `docs/CONTEXT_PRODUCTION_v3.md`.

Required scripts:

```json
{
  "dev": "ts-node --project tsconfig.server.json server.ts",
  "build": "next build",
  "start": "NODE_ENV=production ts-node --project tsconfig.server.json server.ts",
  "db:migrate": "prisma migrate dev --name",
  "db:seed": "ts-node --project tsconfig.server.json prisma/seed.ts",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset --force && npm run db:seed",
  "test": "jest --coverage",
  "typecheck": "tsc --noEmit"
}
```

Required dev dependencies include:

- ts-node
- @types/node
- @types/bcryptjs
- @types/crypto-js
- jest or vitest test types depending on chosen runner

Prisma runtime dependencies (approved for this project):

- `@prisma/adapter-mariadb`
- `mariadb`

Decision:

- This project uses Prisma 7 adapter mode.
- These two dependencies are approved exceptions to the no-new-dependency rule.

Do not add unnecessary dependencies.

---

## 2. tsconfig.json

Create strict Next.js TypeScript config.

Requirements:

- strict true
- noEmit true
- no any
- path alias `@/*` to `src/*`
- exclude server.ts and prisma/seed.ts from main app typecheck if needed

Also create `tsconfig.server.json` for ts-node:

- commonjs module
- includes server.ts, prisma/seed.ts, src/lib, src/shared/types, src/server if needed

---

## 3. prisma/schema.prisma

Create full production schema.

Required enums:

```prisma
enum UserRole {
  SUPERADMIN
  ADMIN
  JURY
}

enum MatchPhase {
  WAITING
  BRACKET_PREVIEW
  PRESENTING_TEAM1
  PRESENTING_TEAM2
  VOTING
  CLOSED
  WINNER_REVEAL
  BRACKET_UPDATE
  RESULT
}

enum ResultStatus {
  NOT_CALCULATED
  CALCULATED
  TIE_PENDING
  TIE_RESOLVED
}

enum DisplayMode {
  EVENT_WAITING
  BRACKET_PREVIEW
  PRESENTING_TEAM
  VOTING
  VOTING_CLOSED
  WINNER_REVEAL
  BRACKET_UPDATE
  FINAL_BRACKET
  EVENT_FINISHED
}

enum AuditAction {
  USER_CREATED
  USER_UPDATED
  USER_DEACTIVATED
  TEAM_UPDATED
  PHASE_CHANGED
  TIMER_CHANGED
  VOTING_OPENED
  VOTING_CLOSED
  RESULT_CALCULATED
  RESULT_SHOWN
  TIE_RESOLVED
  DISPLAY_MODE_CHANGED
}
```

Required models:

```prisma
model User {
  id           String     @id @default(cuid())
  name         String
  username     String     @unique
  passwordHash String
  role         UserRole
  isActive     Boolean    @default(true)
  createdBy    String?
  juryVotes    JuryVote[]
  auditLogs    AuditLog[] @relation("AuditActor")
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([role, isActive])
  @@map("users")
}

model Challenge {
  id        String   @id @default(cuid())
  slug      String   @unique
  nameAr    String
  order     Int      @unique
  match     Match?
  teams     Team[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("challenges")
}

model Team {
  id          String       @id @default(cuid())
  nameAr      String
  ideaAr      String
  challengeId String
  challenge   Challenge    @relation(fields: [challengeId], references: [id])
  asTeam1     Match[]      @relation("Team1")
  asTeam2     Match[]      @relation("Team2")
  wonMatches  Match[]      @relation("Winner")
  juryVotes   JuryVote[]
  publicVotes PublicVote[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([challengeId])
  @@map("teams")
}

model Match {
  id            String       @id @default(cuid())
  challengeId   String       @unique
  challenge     Challenge    @relation(fields: [challengeId], references: [id])
  team1Id       String
  team1         Team         @relation("Team1", fields: [team1Id], references: [id])
  team2Id       String
  team2         Team         @relation("Team2", fields: [team2Id], references: [id])
  winnerId      String?
  winner        Team?        @relation("Winner", fields: [winnerId], references: [id])
  phase         MatchPhase   @default(WAITING)
  resultStatus  ResultStatus @default(NOT_CALCULATED)
  team1Final    Float?
  team2Final    Float?
  timerSecs     Int          @default(600)
  timerActive   Boolean      @default(false)
  voteOpenAt    DateTime?
  voteCloseAt   DateTime?
  resultShownAt DateTime?
  juryVotes     JuryVote[]
  publicVotes   PublicVote[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([phase])
  @@index([resultStatus])
  @@index([winnerId])
  @@map("matches")
}

model JuryVote {
  id        String   @id @default(cuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id])
  createdAt DateTime @default(now())

  @@unique([matchId, userId])
  @@index([matchId, teamId])
  @@index([userId])
  @@map("jury_votes")
}

model PublicVote {
  id              String   @id @default(cuid())
  matchId         String
  match           Match    @relation(fields: [matchId], references: [id])
  teamId          String
  team            Team     @relation(fields: [teamId], references: [id])
  hashedIp        String
  fingerprintHash String
  createdAt       DateTime @default(now())

  @@index([matchId])
  @@index([matchId, hashedIp])
  @@index([matchId, fingerprintHash])
  @@index([matchId, teamId])
  @@map("public_votes")
}

model EventControl {
  id             String      @id @default(cuid())
  displayMode    DisplayMode @default(EVENT_WAITING)
  currentMatchId String?
  updatedBy      String?
  updatedAt      DateTime    @updatedAt
  createdAt      DateTime    @default(now())

  @@map("event_control")
}

model AuditLog {
  id        String      @id @default(cuid())
  actorId   String?
  actor     User?       @relation("AuditActor", fields: [actorId], references: [id])
  action    AuditAction
  entity    String
  entityId  String?
  metadata  Json?
  createdAt DateTime    @default(now())

  @@index([actorId])
  @@index([action])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

Important:

- Do not add `juryMembersCount` to Match.
- Jury count is derived from active JURY users.
- Do not store raw IP.
- Add `@@map` to all models.
- Use indexes required for high voting volume.

---

## 4. prisma/seed.ts

Seed fixed data.

Challenges:

```ts
const challenges = [
  {
    slug: "digital",
    nameAr: "التحول الرقمي والخدمات الحكومية والاجتماعية",
    order: 1,
  },
  { slug: "agriculture", nameAr: "الزراعة والأمن الغذائي", order: 2 },
  { slug: "transport", nameAr: "النقل والخدمات الذكية", order: 3 },
];
```

Teams:

Digital:

- Team A: "فريق التحول 1" — idea: "منصة رقمية للخدمات الحكومية"
- Team B: "فريق التحول 2" — idea: "تطبيق الهوية الرقمية"

Agriculture:

- Team A: "فريق الزراعة 1" — idea: "نظام ري ذكي"
- Team B: "فريق الزراعة 2" — idea: "سوق إلكتروني للمزارعين"

Transport:

- Team A: "فريق النقل 1" — idea: "تطبيق المواصلات الذكية"
- Team B: "فريق النقل 2" — idea: "نظام مشاركة السيارات"

Seed:

- 3 challenges.
- 6 teams.
- 3 matches.
- 1 event control row.
- 1 superadmin.

Superadmin:

- username from SUPERADMIN_USERNAME.
- password from SUPERADMIN_PASSWORD.
- passwordHash via bcrypt.
- role SUPERADMIN.
- isActive true.

Rules:

- Use upsert everywhere.
- Seed is re-runnable.
- Do not seed production jury users.
- Do not use console.log; use logger.

---

## 5. src/lib/prisma/client.ts

Create Prisma singleton with hot reload safety.

Requirements:

- Use PrismaClient.
- Use Prisma 7 adapter mode with `@prisma/adapter-mariadb` and `mariadb`.
- Read `DATABASE_URL` in this client file and pass it to the adapter.
- Use development logs only in development.
- Export `prisma`.
- Use canonical imports from `@/lib/prisma/client`.

---

## 6. src/lib/logger.ts

Create pino wrapper.

Requirements:

- info in production.
- debug in development.
- pretty transport only outside production.
- default export logger.

No console.log.

---

## 7. src/lib/vote-calc.ts

Implement final production vote calculation.

Types:

```ts
export interface CalcInput {
  juryMembersCount: number;
  juryVotesTeam1: number;
  juryVotesTeam2: number;
  publicVotesTeam1: number;
  publicVotesTeam2: number;
}

export type WinnerSide = "team1" | "team2";

export interface CalcResult {
  team1Final: number;
  team2Final: number;
  team1JuryScore: number;
  team2JuryScore: number;
  team1PublicScore: number;
  team2PublicScore: number;
  winnerSide: WinnerSide | null;
  isTie: boolean;
  usedPublicVotes: boolean;
}
```

Rules:

- Do not import Prisma.
- Pure function only.
- Round to 1 decimal using `Math.round(value * 10) / 10`.
- Reject invalid input by throwing typed errors or returning a failure object.
- No `any`.

Calculation:

If publicTotal > 0:

```txt
juryVoteWeight = 60 / juryMembersCount

team1JuryScore = juryVotesTeam1 * juryVoteWeight
team2JuryScore = juryVotesTeam2 * juryVoteWeight

team1PublicScore = (publicVotesTeam1 / publicTotal) * 40
team2PublicScore = (publicVotesTeam2 / publicTotal) * 40

team1Final = team1JuryScore + team1PublicScore
team2Final = team2JuryScore + team2PublicScore
```

If publicTotal = 0:

```txt
juryVotesCast = juryVotesTeam1 + juryVotesTeam2

team1Final = (juryVotesTeam1 / juryVotesCast) * 100
team2Final = (juryVotesTeam2 / juryVotesCast) * 100
```

Invalid:

- juryMembersCount <= 0.
- juryVotesTeam1 < 0.
- juryVotesTeam2 < 0.
- publicVotesTeam1 < 0.
- publicVotesTeam2 < 0.
- juryVotesTeam1 + juryVotesTeam2 > juryMembersCount.
- juryVotesTeam1 + juryVotesTeam2 = 0.

Tie:

- winnerSide = null.
- isTie = true.
- Never auto-pick team1.

---

## 8. src/lib/anti-duplicate.ts

Implement:

```ts
export function hashIp(ip: string, matchId: string): string;
```

Rules:

- SHA-256.
- Salt from VOTE_HASH_SALT.
- Do not log raw IP.

Implement:

```ts
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason: "IP" | "FINGERPRINT" | null;
}

export async function checkDuplicate(
  matchId: string,
  hashedIp: string,
  fingerprintHash: string,
): Promise<DuplicateCheckResult>;
```

Rules:

- Check IP and fingerprint separately.
- Use Promise.all.
- Return IP first if both exist.
- Use indexed fields.
- No raw IP.
- try/catch in async function.

---

## 9. src/shared/types/domain.types.ts

Re-export Prisma enums.

Define:

- TeamPublic
- ChallengePublic
- MatchPublic
- BracketNode
- BracketState
- EventState
- DisplayMode payload types

Include:

- match phase
- result status
- timer state
- vote timestamps
- winner nullable
- counts

---

## 10. src/shared/types/socket.types.ts

Use Socket.IO generic types.

Define all events from `docs/CONTEXT_PRODUCTION_v3.md`.

Required:

- ServerToClientEvents
- ClientToServerEvents
- InterServerEvents
- SocketData
- TypedServer
- TypedSocket

No `any`.

---

## 11. src/shared/types/api.types.ts

Define:

```ts
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
```

Define request/response types for:

- PublicVoteRequest
- JuryVoteRequest
- AdminDisplayModeRequest
- AdminPhaseRequest
- AdminTimerRequest
- AdminShowResultRequest
- AdminResolveTieRequest
- VoteResultResponse
- BracketStateResponse
- EventStateResponse

---

## 12. src/app/api/auth/[...nextauth]/route.ts

Implement NextAuth credentials provider.

Rules:

- Query active user by username.
- Compare password with bcrypt.compare.
- Include id, name, role in JWT and session.
- JWT session strategy.
- Reject inactive users.
- No registration route.
- No business logic beyond auth validation.

Also add NextAuth type augmentation:

- session.user.id
- session.user.role
- token.role
- file location: `src/shared/types/next-auth.d.ts`

---

## 13. .env.example

Include:

```env
DATABASE_URL="mysql://user:password@localhost:3306/marathon_ideas"
NEXTAUTH_SECRET="min-32-chars-random-string"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
VOTE_HASH_SALT="random-long-secret-salt"
SUPERADMIN_USERNAME="superadmin"
SUPERADMIN_PASSWORD="change-in-production"
NODE_ENV="development"
```

---

## 14. tests/vote-calc.test.ts

Test all:

1. 5 jury users, public votes exist.
2. 6 jury users, public votes exist.
3. Arbitrary active jury count.
4. No public votes: jury result normalized to 100.
5. Zero jury members rejected.
6. Zero jury votes rejected.
7. Jury votes greater than jury members rejected.
8. Negative votes rejected.
9. Tie returns winnerSide null and isTie true.
10. Floating results round to 1 decimal.
11. Public score uses 40% only.
12. Jury score uses 60 / active jury count.

---

## 15. tests/anti-duplicate.test.ts

Test:

- Same IP same match → duplicate IP.
- Same fingerprint same match → duplicate FINGERPRINT.
- Both same → duplicate IP first.
- Same IP different match → not duplicate.
- Same fingerprint different match → not duplicate.
- Both different → not duplicate.
- hashIp returns stable SHA-256 hash.
- hashIp changes per match.

Mock Prisma cleanly.
No real database required for unit tests.

---

# CONSTRAINTS

1. Zero `any`.
2. Every async function uses try/catch.
3. Seed uses upsert everywhere.
4. Never store raw IP.
5. Prisma is allowed only in `repository.ts`, `src/lib/prisma/client.ts`, and `prisma/`.
6. Prisma 7 adapter mode is required for MySQL/MariaDB runtime.
7. `@prisma/adapter-mariadb` and `mariadb` are approved dependency exceptions for this runtime requirement.
8. Do not create UI.
9. Do not create server.ts in this session.
10. Do not implement voting routes in this session.
11. Do not implement result calculation service in this session.
12. Do not implement Socket.IO runtime in this session.
13. `vote-calc.ts` must be pure.
14. Use Zod later in routes; define request types now.
15. Keep business logic out of route handlers.

---

# VERIFY

Run:

```bash
npx prisma validate
npx tsc --noEmit
npm test
npm run db:migrate -- init
npm run db:seed
```

All must pass.

---

# HANDOFF FORMAT

At the end, produce:

```md
## ── HANDOFF TO SESSION 2 ──

### Database Tables

[List each table, fields, indexes, relations]

### Seeded Data

[Challenges, teams, matches, superadmin]

### Types Exported

[List all exported types/interfaces/enums]

### Vote Calculation Contract

[Exact formula and invalid states]

### Anti-Duplicate Contract

[Hashing, duplicate logic, indexes used]

### Auth Setup

[JWT fields, session shape, roles]

### Remaining Work For Session 2

[Backend services/routes only, no UI yet]

### Verification Results

[Command outputs summary]
```
