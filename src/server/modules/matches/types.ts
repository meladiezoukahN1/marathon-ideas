export type TimerStatus = "READY" | "RUNNING" | "PAUSED" | "FINISHED"
export type TeamSlot = "TEAM1" | "TEAM2"

export interface TimerState {
  matchId: string
  teamSlot: TeamSlot
  durationSeconds: number
  remainingSeconds: number
  status: TimerStatus
  startedAt: string | null
  pausedAt: string | null
  updatedAt: string
}

export interface TimerPayload {
  remainingSeconds?: number
  deltaSeconds?: number
}

export interface AdminMatchListItem {
  id: string
  name: string
  order: number
  status: string
  phase: string
  winnerId: string | null
  voteOpenAt: string | null
  voteCloseAt: string | null
  votingStartedAt: string | null
  votingEndsAt: string | null
  votingDurationSeconds: number
  votingSessionId: string | null
  votingTimerStatus: string
  votingTimerPausedAt: string | null
  team1FinalScore: number | null
  team2FinalScore: number | null
  team1PublicPct: number | null
  team2PublicPct: number | null
  team1JuryPct: number | null
  team2JuryPct: number | null
  team1: { id: string; name: string } | null
  team2: { id: string; name: string } | null
  team1Timer: TimerState
  team2Timer: TimerState
}

export interface PublicActiveMatch {
  id: string
  name: string
  order: number
  phase: string
  winnerId: string | null
  team1FinalScore: number | null
  team2FinalScore: number | null
  team1PublicPct: number | null
  team2PublicPct: number | null
  team1JuryPct: number | null
  team2JuryPct: number | null
  isTie: boolean
  tieReason: string | null
  votingEndsAt: string | null
  votingSessionId: string | null
  votingTimerStatus: string
  votingTimerPausedAt: string | null
  votingDurationSeconds: number
  team1: { id: string; name: string; imageUrl: string | null } | null
  team2: { id: string; name: string; imageUrl: string | null } | null
  team1Timer: TimerState
  team2Timer: TimerState
  team1TimerSnapshot: import("@/lib/timer-snapshot").TimerSnapshot
  team2TimerSnapshot: import("@/lib/timer-snapshot").TimerSnapshot
  votingTimerSnapshot: import("@/lib/timer-snapshot").TimerSnapshot
  activePresentationTeam: import("@/lib/timer-snapshot").ActivePresentationTeam
  serverNow: string
}

export interface VoteCounts {
  team1Public: number
  team2Public: number
  totalPublic: number
  team1Jury: number
  team2Jury: number
  totalJury: number
}

export interface MatchResult {
  winnerId: string | null
  team1FinalScore: number
  team2FinalScore: number
  team1PublicPct: number
  team2PublicPct: number
  team1JuryPct: number
  team2JuryPct: number
}

export interface CurrentUser {
  id: string
  role: "SUPERADMIN" | "ADMIN" | "JURY"
}

export interface VoteAuditEntry {
  id: string
  matchId: string
  teamId: string
  teamName: string
  voterIdentifier: string | null
  votingSessionId: string | null
  voteType: "PUBLIC" | "JURY"
  createdAt: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface VoteAuditResponse {
  data: VoteAuditEntry[]
  pagination: PaginationMeta
}
