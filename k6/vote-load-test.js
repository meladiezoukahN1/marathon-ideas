import http from "k6/http"
import { sleep } from "k6"
import { Trend, Counter, Rate } from "k6/metrics"

/*
  k6 load test for POST /api/votes

  Usage:
    k6 run -e BASE_URL=http://localhost:3000 k6/vote-load-test.js

  Docker (note: use host.docker.internal for host on Mac/Windows):
    docker run --rm -i grafana/k6 run \
      -e BASE_URL=http://host.docker.internal:3000 \
      - < k6/vote-load-test.js

  Prerequisites:
    1. App server running (npm run dev or npm start)
    2. An active VOTING challenge exists in the DB
       (script auto-fetches it via GET /api/public/active-challenge)
*/

const BASE_URL = __ENV.BASE_URL
if (!BASE_URL) {
  throw new Error("BASE_URL environment variable is required")
}

// ─── Custom metrics ──────────────────────────────────────────────────────────

const voteDuration     = new Trend("vote_duration")
const successRate      = new Rate("vote_success")
const totalAttempts    = new Counter("total_attempts")
const acceptedVotes    = new Counter("accepted_votes")
const duplicateCount   = new Counter("http_409_duplicate")
const notOpenCount     = new Counter("http_400_voting_not_open")
const closedCount      = new Counter("http_400_voting_closed")
const invalidTeam      = new Counter("http_400_invalid_team")
const invalidInput     = new Counter("http_400_invalid_input")
const redisUnAvail     = new Counter("http_503_redis_unavailable")
const serverError      = new Counter("http_500_server_error")

// ─── Config ──────────────────────────────────────────────────────────────────

export const options = {
  thresholds: {
    vote_duration: ["p(95)<500", "p(99)<2000"],
  },
  scenarios: {
    // 1,000 votes over 60 seconds (~16.67 v/s)
    votes_1000_60s: {
      executor: "constant-arrival-rate",
      rate: 1000,
      timeUnit: "60s",
      duration: "60s",
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: "voteScenario",
    },

    // 5,000 votes over 60 seconds (~83.33 v/s)
    votes_5000_60s: {
      executor: "constant-arrival-rate",
      rate: 5000,
      timeUnit: "60s",
      duration: "60s",
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: "voteScenario",
    },

    // 10,000 votes over 120 seconds (~83.33 v/s)
    votes_10000_120s: {
      executor: "constant-arrival-rate",
      rate: 10000,
      timeUnit: "120s",
      duration: "120s",
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: "voteScenario",
    },

    // Duplicate test: same voterToken 100 times — must produce only 1 accepted vote
    duplicate_test: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 100,
      maxDuration: "30s",
      exec: "duplicateVoteScenario",
    },
  },
}

// ─── Setup: discover an active VOTING challenge ─────────────────────────────

export function setup() {
  const res = http.get(`${BASE_URL}/api/public/active-challenge`)
  const body = res.json()

  if (!body || !body.data) {
    throw new Error(
      `No active VOTING challenge found. GET /api/public/active-challenge returned ${res.status}: ${res.body}`,
    )
  }

  const c = body.data
  if (c.phase !== "VOTING") {
    throw new Error(
      `Challenge ${c.id} is in phase "${c.phase}", expected "VOTING". ` +
        "Start voting before running the load test.",
    )
  }

  if (!c.team1 || !c.team2 || !c.team1.id || !c.team2.id) {
    throw new Error("Active challenge is missing team data")
  }

  console.log(`Using challenge: ${c.id} (${c.title})`)
  console.log(`  Team 1: ${c.team1.id} (${c.team1.name})`)
  console.log(`  Team 2: ${c.team2.id} (${c.team2.name})`)
  console.log(`  Voting session: ${c.votingSessionId}`)
  console.log(`  Voting ends at: ${c.votingEndsAt}`)

  return {
    challengeId: c.id,
    team1Id: c.team1.id,
    team2Id: c.team2.id,
    team1Name: c.team1.name,
    team2Name: c.team2.name,
  }
}

// ─── Vote scenario (used by 1000/60s, 5000/60s, 10000/120s) ─────────────────

export function voteScenario(data) {
  // Globally unique voterToken per VU/iteration
  const voterToken = `loadtest-vu${__VU}-iter${__ITER}-${Date.now()}`

  // Distribute votes evenly between team1 and team2
  const teamId = __ITER % 2 === 0 ? data.team1Id : data.team2Id

  const payload = JSON.stringify({
    challengeId: data.challengeId,
    teamId,
    voterToken,
  })

  const res = http.post(`${BASE_URL}/api/votes`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { scenario: "load" },
  })

  recordResult(res, voterToken, teamId)

  // Small sleep between iterations to avoid thundering herd
  sleep(0.01)
}

// ─── Duplicate scenario (same voterToken 100 times) ─────────────────────────

export function duplicateVoteScenario(data) {
  const voterToken = `loadtest-dup-vu${__VU}`

  const payload = JSON.stringify({
    challengeId: data.challengeId,
    teamId: data.team1Id,
    voterToken,
  })

  const res = http.post(`${BASE_URL}/api/votes`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { scenario: "duplicate" },
  })

  recordResult(res, voterToken, data.team1Id)
}

// ─── Record metrics for a single vote response ──────────────────────────────

function recordResult(res, voterToken, teamId) {
  totalAttempts.add(1)
  voteDuration.add(res.timings.duration)

  if (res.status === 200) {
    successRate.add(true)
    acceptedVotes.add(1)
  } else {
    successRate.add(false)
    switch (res.status) {
      case 409:
        duplicateCount.add(1)
        break
      case 400: {
        const err = extractError(res)
        if (err === "VOTING_NOT_OPEN") {
          notOpenCount.add(1)
        } else if (err === "VOTING_CLOSED") {
          closedCount.add(1)
        } else if (err === "INVALID_TEAM") {
          invalidTeam.add(1)
        } else {
          invalidInput.add(1)
        }
        break
      }
      case 503:
        redisUnAvail.add(1)
        break
      default:
        serverError.add(1)
        break
    }
  }
}

// ─── Teardown: read final Redis counter via the app API ──────────────────────

export function teardown(data) {
  // Give Redis a moment to settle
  sleep(1)

  // Read the challenge to get its final state
  const res = http.get(`${BASE_URL}/api/public/active-challenge`)
  console.log(`Teardown /api/public/active-challenge => ${res.status}`)

  // Also try to read admin result if available
  const adminRes = http.get(`${BASE_URL}/api/admin/matches`)
  console.log(`Teardown /api/admin/matches => ${adminRes.status}`)

  console.log(`--- Test complete for challenge "${data.challengeId}" ---`)
  console.log(`Teams: ${data.team1Name} (${data.team1Id}) vs ${data.team2Name} (${data.team2Id})`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractError(res) {
  try {
    return JSON.parse(res.body).error ?? "UNKNOWN"
  } catch {
    return "UNKNOWN"
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  const metrics = data.metrics

  const totalAttempts = metrics.total_attempts?.values?.count ?? 0
  const accepted      = metrics.accepted_votes?.values?.count ?? 0
  const dup           = metrics.http_409_duplicate?.values?.count ?? 0
  const redis503      = metrics.http_503_redis_unavailable?.values?.count ?? 0
  const srvErr        = metrics.http_500_server_error?.values?.count ?? 0
  const notOpen       = metrics["http_400_voting_not_open"]?.values?.count ?? 0
  const closed        = metrics["http_400_voting_closed"]?.values?.count ?? 0
  const invTeam       = metrics["http_400_invalid_team"]?.values?.count ?? 0
  const invInput      = metrics["http_400_invalid_input"]?.values?.count ?? 0
  const reqDuration   = metrics.http_req_duration?.values
  const voteDuration  = metrics.vote_duration?.values

  const successPct = totalAttempts > 0 ? ((accepted / totalAttempts) * 100).toFixed(2) : "0.00"

  const report = `
=======================================
  VOTE LOAD TEST SUMMARY
=======================================

Total vote attempts:  ${totalAttempts}
  Accepted (200):     ${accepted} (${successPct}%)
  Duplicate (409):    ${dup}
  Other failed:       ${totalAttempts - accepted - dup}

--- Latency (all HTTP requests) ---
p95:                   ${reqDuration?.["p(95)"]?.toFixed(2) ?? "N/A"} ms
p99:                   ${reqDuration?.["p(99)"]?.toFixed(2) ?? "N/A"} ms
avg:                   ${reqDuration?.avg?.toFixed(2) ?? "N/A"} ms
min:                   ${reqDuration?.min?.toFixed(2) ?? "N/A"} ms
max:                   ${reqDuration?.max?.toFixed(2) ?? "N/A"} ms

--- Latency (successful votes only) ---
p95:                   ${voteDuration?.["p(95)"]?.toFixed(2) ?? "N/A"} ms
p99:                   ${voteDuration?.["p(99)"]?.toFixed(2) ?? "N/A"} ms
avg:                   ${voteDuration?.avg?.toFixed(2) ?? "N/A"} ms

--- HTTP Error Breakdown ---
409 (Duplicate):       ${dup}
400 (Voting not open): ${notOpen}
400 (Voting closed):   ${closed}
400 (Invalid team):    ${invTeam}
400 (Invalid input):   ${invInput}
503 (Redis unavail):   ${redis503}
500 (Server error):    ${srvErr}

--- Redis Command Count (estimated) ---
Each accepted vote:    1 Lua EVAL (atomic SET NX + INCR)
Each duplicate block:  1 Lua EVAL (SET NX fails → returns 0)

Total Redis commands:  ${totalAttempts} EVAL calls
                        (1 per vote attempt, successful or not)
See analysis in audit report for details.

--- Final Redis Counter ---
Run after the test:
  curl http://localhost:3000/api/public/active-challenge
or check /api/admin/matches for live counters.
The teardown() above logs the raw responses.

=======================================
`

  console.log(report)

  return {
    stdout: report,
  }
}
