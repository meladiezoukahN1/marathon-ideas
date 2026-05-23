# Marathon Ideas — Production Master Context v3.0

## STATUS

This file is the authoritative source for the project.
Every implementation session must read this file before writing code.
Do not infer missing behavior. If a rule is not defined here, stop and report the gap.

---

# 1. PROJECT PURPOSE

Marathon Ideas is a live competition system for an important public event.

The system is intentionally small in number of screens, but must be visually excellent, reliable, fast, and safe under heavy voting traffic.

The event has:

- 3 fixed challenges.
- 2 teams per challenge.
- 1 match per challenge.
- 1 winner per challenge.
- A public display screen.
- An admin control screen.
- A jury voting screen.
- A public QR voting screen.

The admin controls every transition manually.
Nothing important should move automatically except optional timer ticking and vote close timeout if explicitly enabled.

---

# 2. FIXED CHALLENGES

The system has exactly 3 challenges:

1. التحول الرقمي والخدمات الحكومية والاجتماعية
2. الزراعة والأمن الغذائي
3. النقل والخدمات الذكية

These challenges are seeded once and are not created dynamically during the event.

Teams are seeded as placeholders and can be updated by admin before the event.

---

# 3. SCREENS

## 3.1 /display — Main projector screen

Public-facing large display.

Shows:

- Opening/event state.
- Current bracket tree.
- Current challenge.
- Current match phase.
- Current team presentation.
- Countdown timer.
- Voting QR during voting phase.
- Live public vote totals only if admin allows it.
- Winner reveal full-screen animation.
- Bracket update after winner reveal.

This screen must be highly polished because it is the main visual output of the event.

## 3.2 /admin — Admin control panel

Authenticated admin/superadmin only.

Controls:

- Start event.
- Show bracket before each match.
- Start team 1 presentation.
- Start team 2 presentation.
- Open voting.
- Close voting.
- Show winner reveal.
- Move to bracket update.
- Move to next challenge.
- Control timer: play, pause, reset, adjust.
- See hidden live results before public reveal.
- Manage teams before event.
- Manage jury users before event.

Admin is the only actor that triggers screen transitions.

## 3.3 /jury — Jury voting screen

Authenticated jury users only.

Rules:

- A jury member can vote once per match.
- Vote can be changed only if the admin has enabled vote editing before voting closes.
- Default: vote is final.
- Jury sees only the active voting match.
- Jury cannot vote outside VOTING phase.

## 3.4 /vote — Public QR voting screen

Public, no account.

Rules:

- Only shows the currently active voting match.
- Public user can vote once per match.
- Uses localStorage + hashed IP + browser fingerprint to reduce duplicates.
- Must be extremely lightweight for high traffic.

---

# 4. EVENT FLOW

The event has three challenge rounds.

Before each challenge match, the bracket tree is shown.

## 4.1 Global flow

```txt
EVENT_WAITING
  ↓ admin
SHOW_BRACKET_ROUND_1
  ↓ admin
MATCH_1_PRESENTING_TEAM1
  ↓ admin
MATCH_1_PRESENTING_TEAM2
  ↓ admin
MATCH_1_VOTING
  ↓ admin or timeout
MATCH_1_CLOSED
  ↓ admin
MATCH_1_WINNER_REVEAL
  ↓ admin
SHOW_BRACKET_ROUND_2
  ↓ admin
MATCH_2_PRESENTING_TEAM1
  ↓ admin
MATCH_2_PRESENTING_TEAM2
  ↓ admin
MATCH_2_VOTING
  ↓ admin or timeout
MATCH_2_CLOSED
  ↓ admin
MATCH_2_WINNER_REVEAL
  ↓ admin
SHOW_BRACKET_ROUND_3
  ↓ admin
MATCH_3_PRESENTING_TEAM1
  ↓ admin
MATCH_3_PRESENTING_TEAM2
  ↓ admin
MATCH_3_VOTING
  ↓ admin or timeout
MATCH_3_CLOSED
  ↓ admin
MATCH_3_WINNER_REVEAL
  ↓ admin
FINAL_BRACKET
  ↓ admin
EVENT_FINISHED
```

## 4.2 Match phase enum

```txt
WAITING
BRACKET_PREVIEW
PRESENTING_TEAM1
PRESENTING_TEAM2
VOTING
CLOSED
WINNER_REVEAL
BRACKET_UPDATE
RESULT
```

## 4.3 Display behavior per phase

### WAITING

Display event title, sponsor/logo area, and standby animation.

### BRACKET_PREVIEW

Display the bracket tree full screen.
Highlight the upcoming challenge.
Show both teams for the upcoming match.

### PRESENTING_TEAM1

Display team 1 full screen:

- Team name.
- Idea title/description.
- Challenge name.
- Presentation timer.
- Elegant motion background.
- No voting QR.

### PRESENTING_TEAM2

Display team 2 full screen:

- Team name.
- Idea title/description.
- Challenge name.
- Presentation timer.
- Elegant motion background.
- No voting QR.

### VOTING

Display:

- Challenge name.
- Both teams.
- QR code.
- Voting countdown.
- Optional live vote bars if admin enables them.

### CLOSED

Display:

- Voting closed state.
- Result is calculated internally.
- Public screen does not show winner yet.

### WINNER_REVEAL

Display winner full screen:

- Winning team name.
- Idea.
- Score.
- Confetti/celebration animation.
- Smooth cinematic transition.
- No excessive text.

### BRACKET_UPDATE

Display bracket tree again.
The winner is inserted/highlighted.
Then admin moves to next challenge.

### RESULT

Stable final view for that match or event.

---

# 5. BRACKET TREE REQUIREMENT

The bracket is not a traditional elimination tournament between all winners.
It is a visual competition progress tree for the 3 fixed challenge matches.

It must show:

- Challenge 1 branch: Team 1 vs Team 2 → Winner.
- Challenge 2 branch: Team 1 vs Team 2 → Winner.
- Challenge 3 branch: Team 1 vs Team 2 → Winner.

Before each match:

- Show the full bracket tree.
- Highlight the upcoming challenge.
- Show previous winners if any.
- Keep future branches in pending state.

After each winner reveal:

- Show the bracket tree again.
- Animate winner moving into the winner slot.
- Mark the completed challenge as done.
- Admin then proceeds to the next challenge.

Bracket state is derived from matches and winners.
Do not duplicate winner data outside Match.winnerId.

---

# 6. VOTING RULES — FINAL

## 6.1 Jury vote weight

Jury members are not hardcoded.

The number of jury members is derived from active jury users created by the admin before the event starts.

```txt
juryMembersCount = count(active users where role = JURY)
juryVoteWeight = 60 / juryMembersCount
```

Examples:

- 5 active jury members → each vote = 12 points.
- 6 active jury members → each vote = 10 points.

The system must not store a fixed jury count in Match.
The system must not hardcode 5 or 6 in calculation logic.

## 6.2 Public vote weight

Public voting is always 40% when at least one public vote exists.

```txt
publicTotal = publicVotesTeam1 + publicVotesTeam2
```

If publicTotal > 0:

```txt
team1PublicScore = (publicVotesTeam1 / publicTotal) * 40
team2PublicScore = (publicVotesTeam2 / publicTotal) * 40
```

## 6.3 Final calculation when public votes exist

```txt
team1JuryScore = juryVotesTeam1 * (60 / juryMembersCount)
team2JuryScore = juryVotesTeam2 * (60 / juryMembersCount)

team1Final = team1JuryScore + team1PublicScore
team2Final = team2JuryScore + team2PublicScore
```

## 6.4 Final calculation when public votes do not exist

If no public votes exist, the result is based only on jury votes and normalized to 100.

```txt
juryVotesCast = juryVotesTeam1 + juryVotesTeam2

team1Final = (juryVotesTeam1 / juryVotesCast) * 100
team2Final = (juryVotesTeam2 / juryVotesCast) * 100
```

## 6.5 Invalid result states

The system must reject result calculation if:

- juryMembersCount = 0.
- juryVotesCast = 0.
- juryVotesTeam1 + juryVotesTeam2 > juryMembersCount.
- match phase is not CLOSED or WINNER_REVEAL or RESULT.
- teamId does not belong to the match.

## 6.6 Tie handling

The system must not automatically pick team1 on tie.

If final scores are equal:

- match result status becomes TIE_PENDING.
- admin must choose a tie-break winner manually.
- tie-break action must be audit logged.
- display must show “تعادل — بانتظار قرار لجنة التحكيم” until resolved.

## 6.7 Voting Audit Exception

Voting persistence is traceable by designated domain tables.

- PublicVote rows are the official audit trail for public voting.
- JuryVote rows are the official audit trail for jury voting.
- Do not write AuditLog for public vote submissions.
- Do not write AuditLog for jury vote submissions in this version.

AuditLog is required for administrative/control mutations only:

- display mode changes
- match phase changes
- timer actions
- voting open/close
- result calculation/show
- tie resolution

---

# 7. ANTI-DUPLICATE PUBLIC VOTING

Browser cannot read MAC address. Do not attempt it.

Use 3 layers:

## Layer 1 — localStorage

Client key:

```txt
voted_match_{matchId}
```

Purpose:

- Fast user feedback.
- Blocks normal repeated attempts.

Not trusted alone.

## Layer 2 — hashed IP

Never store raw IP.

```txt
hashedIp = SHA256(ip + ":" + matchId + ":" + VOTE_HASH_SALT)
```

Reject if same matchId + hashedIp already exists.

## Layer 3 — browser fingerprint

Use FingerprintJS visitorId/fingerprint hash.

Reject if same matchId + fingerprintHash already exists.

## Reject rule

Reject public vote if any duplicate layer matches:

```txt
localStorage OR hashedIp OR fingerprintHash
```

Server is authoritative.
Client-only checks are convenience only.

---

# 8. PERFORMANCE REQUIREMENTS

The event may receive more than 10,000 public votes in one minute during each voting phase.

This means:

- Public voting API must be fast.
- Public vote writes must be minimal.
- Public vote response must not calculate full results on every request.
- Heavy joins are forbidden in the public vote route.
- Use direct indexed lookups.
- Use database indexes for matchId, hashedIp, fingerprintHash, teamId.
- Public vote insert must be idempotent-safe at application level.
- WebSocket broadcast must be throttled.
- Do not emit one socket event per vote to every client.
- Aggregate vote updates every 250ms–1000ms.
- Display screen should receive summarized counts only.
- The public vote page must not load the full app dashboard bundle.
- Avoid large client libraries on /vote.
- QR voting page must be simple, cached, and mobile-first.
- All route inputs must be validated with Zod.
- API must use structured JSON responses.
- No console.log in production.
- Use pino logger with controlled log volume.

Recommended behavior:

- Public vote route writes vote and returns success immediately.
- A lightweight aggregation service updates counts.
- Socket layer broadcasts batched vote totals.
- Admin panel can fetch exact totals on demand.

---

# 9. DATABASE SCHEMA REQUIREMENTS

Use MySQL 8 and Prisma.

Required models:

- User
- Challenge
- Team
- Match
- JuryVote
- PublicVote
- AuditLog
- EventState or EventControl

## 9.1 User

Fields:

- id
- name
- username unique
- passwordHash
- role
- isActive default true
- createdBy nullable
- createdAt
- updatedAt

Roles:

```txt
SUPERADMIN
ADMIN
JURY
```

## 9.2 Challenge

Fields:

- id
- slug unique
- nameAr
- order unique
- match relation

## 9.3 Team

Fields:

- id
- nameAr
- ideaAr
- challengeId
- createdAt
- updatedAt

## 9.4 Match

Fields:

- id
- challengeId unique
- team1Id
- team2Id
- winnerId nullable
- phase
- resultStatus
- timerSecs
- timerActive
- voteOpenAt nullable
- voteCloseAt nullable
- resultShownAt nullable
- createdAt
- updatedAt

Do not add juryMembersCount to Match.

## 9.5 JuryVote

Rules:

- One active jury user can vote once per match.
- Unique constraint: matchId + userId.

## 9.6 PublicVote

Rules:

- Stores only hashed IP and fingerprint.
- No raw IP.
- No unique constraints required if duplicate reason must be detected separately.
- Must have indexes:
  - matchId
  - matchId + hashedIp
  - matchId + fingerprintHash
  - matchId + teamId

## 9.7 AuditLog

Required for:

- phase changes
- timer changes
- vote open/close
- winner reveal
- tie-break decisions
- user creation/deactivation
- team updates

## 9.8 EventControl

Stores current global display state:

- id
- currentMatchId nullable
- displayMode
- updatedBy
- updatedAt

Display mode enum:

```txt
EVENT_WAITING
BRACKET_PREVIEW
PRESENTING_TEAM
VOTING
VOTING_CLOSED
WINNER_REVEAL
BRACKET_UPDATE
FINAL_BRACKET
EVENT_FINISHED
```

---

# 10. SOCKET EVENTS

Use Socket.IO.

## Server → Client

```ts
event:state
payload: {
  displayMode: DisplayMode
  currentMatchId: string | null
  matches: MatchPublic[]
}

match:phase
payload: {
  matchId: string
  phase: MatchPhase
  timerSecs: number
}

timer:tick
payload: {
  matchId: string
  secondsLeft: number
}

vote:update
payload: {
  matchId: string
  publicTeam1: number
  publicTeam2: number
  juryTeam1: number
  juryTeam2: number
  totalPublic: number
}

result:show
payload: {
  matchId: string
  team1Final: number
  team2Final: number
  winnerId: string | null
  winnerName: string | null
  isTie: boolean
}

bracket:update
payload: {
  currentMatchId: string | null
  completedMatchIds: string[]
  winners: Array<{ matchId: string; teamId: string; teamName: string }>
}
```

## Client → Server

Admin only:

```ts
admin: set - display - mode;
admin: phase;
admin: timer;
admin: open - voting;
admin: close - voting;
admin: show - result;
admin: show - bracket;
admin: resolve - tie;
```

Jury only:

```ts
jury: vote;
```

Public vote should use HTTP POST, not socket, for reliability and validation.

---

# 11. UI / ANIMATION STANDARD

The system is simple, so visual quality must be high.

Use:

- Arabic RTL layout.
- Large readable typography for projector screen.
- High contrast.
- Smooth transitions.
- Framer Motion for page/phase transitions.
- Confetti only during winner reveal.
- Bracket animations between matches.
- Team full-screen reveal during presentations.
- Winner full-screen reveal after result.
- Avoid visual clutter.
- Avoid long paragraphs on display screen.
- Keep admin panel functional and clear.

Animation must not break performance:

- No constant heavy particle effects during voting.
- No huge DOM trees.
- No excessive rerenders.
- Memoize display components.
- Throttle live vote updates.

---

# 12. TECH STACK

Framework:

- Next.js App Router

Language:

- TypeScript strict

Database:

- MySQL 8

ORM:

- Prisma

Prisma runtime mode:

- This project uses Prisma 7 adapter mode.
- For MySQL/MariaDB runtime, install and use:
  - `@prisma/adapter-mariadb`
  - `mariadb`
- Prisma client location is fixed to:
  - `src/lib/prisma/client.ts`
- The adapter must read connection details from `DATABASE_URL`.
- `@prisma/adapter-mariadb` and `mariadb` are approved exceptions to the no-new-dependency rule for this project.

Realtime:

- Socket.IO on a long-running Node server

Auth:

- NextAuth/Auth.js credentials strategy with JWT session

Validation:

- Zod

Styling:

- Tailwind CSS

Animation:

- Framer Motion
- canvas-confetti for winner reveal only

State:

- Zustand for client event state

Testing:

- Jest or Vitest

Logging:

- pino

Important:
If deploying to Vercel serverless, classic Socket.IO is not suitable.
Use a long-running Node host, VPS, Railway/Fly/Render, or replace realtime with a managed realtime provider.

---

# 13. CODE STANDARDS

- TypeScript strict.
- Zero `any`.
- Use `unknown` with type guards if needed.
- No business logic in route handlers.
- Route handlers validate input and call services.
- Services orchestrate business logic.
- Repositories are the only layer that calls Prisma.
- All mutations must be traceable: AuditLog for administrative/control mutations, and designated domain vote tables (PublicVote/JuryVote) for high-volume voting submissions.
- All API inputs must use Zod.
- Use Prisma `select`.
- No raw IP storage.
- No console.log.
- Public endpoints must be optimized.
- Max function target: 30 lines unless justified.
- Max file target: 250 lines unless justified.
- Prefer explicit errors over silent fallback.
- Do not add dependencies without justification.
- Exception: `@prisma/adapter-mariadb` and `mariadb` are approved for Prisma 7 adapter mode with MySQL/MariaDB.

---

# 14. REQUIRED MODULE STRUCTURE

Use feature/server modules:

```txt
src/server/modules/
  auth/
  users/
  teams/
  matches/
  voting/
  results/
  bracket/
  event-control/
  audit/
```

Each module should use:

```txt
repository.ts
service.ts
validator.ts
types.ts
policy.ts
```

Workflow/state transition logic must be isolated:

```txt
src/server/modules/matches/workflow.ts
src/server/modules/event-control/workflow.ts
```

Do not place transition rules directly inside routes.

---

# 15. API CONTRACT

## Public

```txt
GET  /api/v1/event/state
GET  /api/v1/vote/current
POST /api/v1/vote/public
```

## Jury

```txt
GET  /api/v1/jury/current
POST /api/v1/vote/jury
```

## Admin

```txt
POST /api/v1/admin/display-mode
POST /api/v1/admin/match/phase
POST /api/v1/admin/timer
POST /api/v1/admin/voting/open
POST /api/v1/admin/voting/close
POST /api/v1/admin/result/show
POST /api/v1/admin/result/resolve-tie
GET  /api/v1/admin/results/live
POST /api/v1/admin/users
PATCH /api/v1/admin/users/:id
PATCH /api/v1/admin/teams/:id
```

---

# 16. ENVIRONMENT VARIABLES

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

# 17. SEED DATA

Seed:

- 3 challenges.
- 2 teams per challenge as placeholders.
- 1 match per challenge.
- superadmin from environment variables.

All seed operations must be upsert and re-runnable.

Do not seed jury users except optionally in development only.
Production jury users are created by admin before the event.

---

# 18. TESTING REQUIREMENTS

Must test:

- vote calculation with 5 jury users.
- vote calculation with 6 jury users.
- vote calculation with arbitrary active jury count.
- public votes present: 60/40 split.
- public votes absent: jury normalized to 100.
- zero jury users rejected.
- zero jury votes rejected.
- jury votes greater than active jury count rejected.
- tie returns TIE_PENDING, not automatic winner.
- duplicate public vote by IP.
- duplicate public vote by fingerprint.
- same IP different match allowed.
- same fingerprint different match allowed.
- invalid team for match rejected.
- phase transitions allowed.
- illegal phase transitions rejected.
- result cannot show before closed.
- bracket updates after winner reveal.

---

# 19. NON-NEGOTIABLE PRODUCTION RULES

- The display must never show a winner before admin triggers reveal.
- Voting must not be open outside VOTING phase.
- Jury count must be derived from active jury users.
- Public vote route must not do heavy result calculation.
- Winner reveal must be admin-triggered.
- Bracket preview must appear before each match.
- Bracket update must appear after each winner reveal.
- All transitions are admin-controlled.
- All critical actions are audit logged.
- Raw IP must never be stored.
- Tie must not auto-select team1.
- Performance must be treated as a core feature.
