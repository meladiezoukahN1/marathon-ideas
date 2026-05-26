export interface MatchUpdatePayload {
  challengeId: string
  phase: "WAITING" | "PRESENTING" | "VOTING" | "RESULT"
  timerSecs: number
  timerActive: boolean
}

export interface VoteCountPayload {
  challengeId: string
  team1Count: number
  team2Count: number
  total: number
  juryCount: number
}

export interface ResultRevealPayload {
  challengeId: string
  winnerId: string
  winnerName: string
  winnerSlot: "TEAM1" | "TEAM2"
  team1Name: string
  team2Name: string
  team1Final: number
  team2Final: number
  team1JuryPct: number
  team2JuryPct: number
  team1PublicPct: number
  team2PublicPct: number
}

export interface TimerTickPayload {
  challengeId: string
  secondsLeft: number
}

export interface JuryVotedPayload {
  challengeId: string
  juryCount: number
}

export interface ServerToClientEvents {
  "challenge:update": (data: MatchUpdatePayload) => void
  "vote:count": (data: VoteCountPayload) => void
  "result:reveal": (data: ResultRevealPayload) => void
  "timer:tick": (data: TimerTickPayload) => void
  "jury:voted": (data: JuryVotedPayload) => void
}

export interface ClientToServerEvents {
  "join:challenge": (challengeId: string) => void
}
