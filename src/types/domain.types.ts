export type UserRole = "SUPERADMIN" | "ADMIN" | "JURY"
export type TeamSlot = "TEAM1" | "TEAM2"
export type EventStatus = "UPCOMING" | "ACTIVE" | "COMPLETED"
export type ChallengeStatus = "PENDING" | "ACTIVE" | "COMPLETED"
export type ChallengePhase = "WAITING" | "PRESENTING" | "VOTING" | "RESULT" | "FINISHED"
export type TimerStatus = "READY" | "RUNNING" | "PAUSED" | "FINISHED"

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

export interface TeamPublic {
  id: string
  name: string
  idea: string
  members: string | null
  imageUrl: string | null
  slot: TeamSlot
}

export interface ChallengePublic {
  id: string
  name: string
  description: string | null
  slug: string
  order: number
  status: ChallengeStatus
  phase: ChallengePhase
  timerSecs: number
  timerActive: boolean
  voteOpenAt: string | null
  voteCloseAt: string | null
  votingStartedAt: string | null
  votingEndsAt: string | null
  votingDurationSeconds: number
  votingSessionId: string | null
  winnerId: string | null
  team1FinalScore: number | null
  team2FinalScore: number | null
  team1PublicPct: number | null
  team2PublicPct: number | null
  team1JuryPct: number | null
  team2JuryPct: number | null
  team1: TeamPublic | null
  team2: TeamPublic | null
  team1Timer?: TimerState
  team2Timer?: TimerState
}

export interface EventPublic {
  id: string
  name: string
  description: string | null
  status: EventStatus
  activeChallengeId: string | null
}

export interface UserPublic {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }
