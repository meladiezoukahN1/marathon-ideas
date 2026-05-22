# Marathon Ideas — Master Project Context
# ════════════════════════════════════════
# READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.
# Every decision in this file is FINAL. Do not deviate.

## 1. Project Overview
A real-time tournament bracket system for startup idea pitches.
Teams compete in elimination rounds (like football brackets).
Each match: both teams present their idea → audience votes via QR → jury votes →
system calculates weighted result → winner advances in bracket.

### Three Screens (run simultaneously):
| Screen         | URL            | Audience          | Purpose                              |
|----------------|----------------|-------------------|--------------------------------------|
| Display Screen | /display       | Big projector     | Bracket tree, timer, QR, results     |
| Admin Panel    | /admin         | Event organizer   | Full control of timer, phases, votes |
| Vote Page      | /vote/[matchId]| Audience (phones) | Tap to vote via QR code              |

---

## 2. Tech Stack — FIXED, DO NOT CHANGE

| Layer        | Technology                          | Version  |
|--------------|-------------------------------------|----------|
| Framework    | Next.js App Router                  | 14.2.x   |
| Language     | TypeScript (strict mode)            | 5.x      |
| Database     | MySQL                               | 8.0      |
| ORM          | Prisma                              | 5.x      |
| Real-time    | Socket.IO                           | 4.7.x    |
| Styling      | Tailwind CSS                        | 3.4.x    |
| Animation    | Framer Motion                       | 11.x     |
| State        | Zustand                             | 4.x      |
| Auth         | NextAuth.js                         | 4.x      |
| QR           | qrcode.react                        | 3.x      |
| Fingerprint  | @fingerprintjs/fingerprintjs        | 4.x      |
| Confetti     | canvas-confetti                     | 1.9.x    |
| Validation   | Zod                                 | 3.x      |
| Testing      | Jest + @testing-library/react       | latest   |
| Logger       | pino                                | 8.x      |

---

## 3. Strict Code Standards

### TypeScript
- `strict: true` in tsconfig.json — no exceptions
- Zero `any` types anywhere — use `unknown` + type guards instead
- All function parameters and return types must be explicitly typed
- Use `satisfies` operator for config objects

### Functions & Files
- Max function length: 30 lines
- Max file length: 200 lines — split if longer
- Single Responsibility: one function does one thing
- No business logic inside API route handlers — extract to `src/lib/`

### Error Handling
- Every async function: try/catch block
- API responses always return: `{ data: T | null, error: string | null }`
- Socket errors: emit `error` event back to sender with typed payload
- Database errors: log with pino, return generic message to client

### Prisma Rules
- Always use `select` — never select all fields (`findMany({})` is forbidden)
- Always add `take` to list queries (max 100)
- Use transactions for multi-step writes (declareWinner, bracket advance)
- Never expose database IDs directly — use cuid() which is already opaque

### API Routes
- Validate every request body with Zod before touching the database
- Rate limit: vote endpoint max 1 req/10s per IP (use upstash or simple in-memory)
- Auth check on every admin route (getServerSession)

### No console.log
- Use `src/lib/logger.ts` (pino wrapper) for all logging
- `logger.info()`, `logger.error()`, `logger.warn()` only

---

## 4. Project File Structure — DO NOT DEVIATE

```
marathon-ideas/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          ← redirect to /display
│   │   ├── display/
│   │   │   └── page.tsx                      ← big screen
│   │   ├── admin/
│   │   │   ├── page.tsx                      ← control panel
│   │   │   └── layout.tsx                    ← auth guard
│   │   ├── vote/
│   │   │   └── [matchId]/
│   │   │       └── page.tsx                  ← audience QR vote
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       ├── vote/
│   │       │   └── route.ts                  ← POST /api/vote
│   │       ├── match/
│   │       │   └── route.ts                  ← GET /api/match
│   │       └── admin/
│   │           └── route.ts                  ← POST /api/admin
│   │
│   ├── components/
│   │   ├── bracket/
│   │   │   ├── BracketTree.tsx
│   │   │   ├── MatchNode.tsx
│   │   │   └── ConnectorLine.tsx
│   │   ├── display/
│   │   │   ├── TimerDisplay.tsx
│   │   │   ├── VotingOverlay.tsx
│   │   │   └── WinnerAnnounce.tsx
│   │   ├── admin/
│   │   │   ├── TimerControl.tsx
│   │   │   ├── PhaseControl.tsx
│   │   │   └── JuryPanel.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── ProgressBar.tsx
│   │       └── Skeleton.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                         ← singleton client
│   │   ├── socket.ts                         ← socket server helper
│   │   ├── vote-calc.ts                      ← pure calculation function
│   │   ├── animation.ts                      ← all Framer constants
│   │   ├── logger.ts                         ← pino wrapper
│   │   └── fingerprint.ts                    ← browser fingerprint helper
│   │
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useBracket.ts
│   │   ├── useTimer.ts
│   │   └── useVoteResult.ts
│   │
│   ├── store/
│   │   ├── matchStore.ts                     ← Zustand match state
│   │   └── bracketStore.ts                   ← Zustand bracket state
│   │
│   └── types/
│       ├── socket.types.ts                   ← all socket event types
│       ├── api.types.ts                      ← API request/response types
│       └── domain.types.ts                   ← business domain types
│
├── server.ts                                 ← custom Node server
├── tests/
│   ├── vote-calc.test.ts
│   └── api/
│       └── vote.test.ts
├── .env.example
├── .env.local
├── tsconfig.json
├── tailwind.config.ts
├── jest.config.ts
└── package.json
```

---

## 5. Database Schema Summary

### Models
- **Event**: top-level container (id, name, status, teams[], matches[])
- **Team**: competing team (id, name, idea, eventId)
- **Match**: one battle (id, eventId, round, position, team1Id, team2Id, winnerId, status, phase, timerSecs, timerActive, voteOpenAt, voteCloseAt)
- **Vote**: audience vote (id, matchId, teamId, voterToken) — @@unique([matchId, voterToken])
- **JuryVote**: jury score (id, matchId, team1Pts, team2Pts, addedBy)

### Enums
- EventStatus: UPCOMING | ACTIVE | COMPLETED
- MatchStatus: PENDING | ACTIVE | COMPLETED
- MatchPhase: WAITING | PRESENTING | VOTING | RESULT

### Key Indexes
- Match(eventId, round) — for bracket queries
- Vote(matchId, voterToken) — for duplicate prevention
- Match(eventId, status) — for active match lookup

---

## 6. Socket Events — TYPED ONLY

### Server → All Clients
```typescript
'match:update'    → { matchId, phase, status, timerSecs, timerActive }
'vote:update'     → { matchId, team1Count, team2Count, team1Pct, team2Pct, total }
'winner:declared' → { matchId, winnerId, winnerName, team1Score, team2Score }
'bracket:advance' → { winnerId, winnerName, nextMatchId, slot: 'team1'|'team2' }
'timer:tick'      → { matchId, secondsLeft }
'error'           → { code: string, message: string }
```

### Client → Server (admin only)
```typescript
'admin:setPhase'      → { matchId, phase: MatchPhase }
'admin:timerControl'  → { matchId, action: 'play'|'pause'|'reset'|'adjust', delta?: number }
'admin:declareWinner' → { matchId, winnerId }
'admin:addJuryVote'   → { matchId, team1Pts: number, team2Pts: number }
```

---

## 7. Vote Calculation Formula

```
juryPct  = jury_team1_pts / (jury_team1_pts + jury_team2_pts) * 100
publicPct = public_team1_votes / total_public_votes * 100

finalTeam1 = juryPct * 0.60 + publicPct * 0.40
finalTeam2 = 100 - finalTeam1

winner = finalTeam1 >= finalTeam2 ? team1 : team2
```

---

## 8. Bracket Advance Logic

```
nextRound    = currentMatch.round + 1
nextPosition = Math.floor(currentMatch.position / 2)
slot         = currentMatch.position % 2 === 0 ? 'team1' : 'team2'

Find: Match where round === nextRound AND position === nextPosition
Set:  match[slot + 'Id'] = winnerId
```

---

## 9. Anti-Duplicate Vote Strategy
1. **Browser layer**: FingerprintJS generates voterToken, stored in localStorage per matchId
2. **API layer**: Zod validates token format before DB write
3. **Database layer**: @@unique([matchId, voterToken]) — final guarantee
4. On duplicate: return HTTP 409 with `{ error: 'ALREADY_VOTED' }`

---

## 10. Performance Rules
- NO polling — Socket.IO for all real-time updates
- canvas-confetti: dynamic import only (not in main bundle)
- qrcode.react: dynamic import with `{ ssr: false }`
- Prisma: connection pool max 10 in production
- Socket rooms: each match has its own room `match:{matchId}`
- Timer: runs server-side (setInterval in socket server), client only displays

---

## 11. Environment Variables
```
DATABASE_URL="mysql://user:password@localhost:3306/marathon_ideas"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
ADMIN_PASSWORD="..."
SUPERADMIN_PASSWORD="..."
NODE_ENV="development"
```