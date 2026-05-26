export interface VoteInput {
  juryForTeam1: number
  juryForTeam2: number
  publicForTeam1: number
  publicForTeam2: number
}

export interface VoteResult {
  team1Final: number
  team2Final: number
  team1JuryPct: number
  team2JuryPct: number
  team1PublicPct: number
  team2PublicPct: number
  winnerId: "team1" | "team2"
}

/** Jury = 60%, Public = 40%. Team1 wins on tie. */
export function calcResult(input: VoteInput): VoteResult {
  const { juryForTeam1, juryForTeam2, publicForTeam1, publicForTeam2 } = input

  const juryTotal = juryForTeam1 + juryForTeam2
  const team1JuryPct = juryTotal > 0
    ? round1((juryForTeam1 / juryTotal) * 100)
    : 50
  const team2JuryPct = round1(100 - team1JuryPct)

  const publicTotal = publicForTeam1 + publicForTeam2
  const team1PublicPct = publicTotal > 0
    ? round1((publicForTeam1 / publicTotal) * 100)
    : 50
  const team2PublicPct = round1(100 - team1PublicPct)

  const team1Final = round1(team1JuryPct * 0.6 + team1PublicPct * 0.4)
  const team2Final = round1(100 - team1Final)

  return {
    team1Final,
    team2Final,
    team1JuryPct,
    team2JuryPct,
    team1PublicPct,
    team2PublicPct,
    winnerId: team1Final >= team2Final ? "team1" : "team2",
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
