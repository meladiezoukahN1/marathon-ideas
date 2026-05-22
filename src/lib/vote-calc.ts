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

export class VoteCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoteCalculationError";
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function validateInput(input: CalcInput): void {
  const {
    juryMembersCount,
    juryVotesTeam1,
    juryVotesTeam2,
    publicVotesTeam1,
    publicVotesTeam2,
  } = input;

  if (juryMembersCount <= 0) {
    throw new VoteCalculationError("juryMembersCount must be greater than zero");
  }

  if (
    juryVotesTeam1 < 0 ||
    juryVotesTeam2 < 0 ||
    publicVotesTeam1 < 0 ||
    publicVotesTeam2 < 0
  ) {
    throw new VoteCalculationError("Votes cannot be negative");
  }

  const juryVotesCast = juryVotesTeam1 + juryVotesTeam2;

  if (juryVotesCast > juryMembersCount) {
    throw new VoteCalculationError(
      "juryVotesTeam1 + juryVotesTeam2 cannot exceed juryMembersCount",
    );
  }

  if (juryVotesCast === 0) {
    throw new VoteCalculationError("juryVotesCast must be greater than zero");
  }
}

export function calculateFinalVote(input: CalcInput): CalcResult {
  validateInput(input);

  const {
    juryMembersCount,
    juryVotesTeam1,
    juryVotesTeam2,
    publicVotesTeam1,
    publicVotesTeam2,
  } = input;

  const publicTotal = publicVotesTeam1 + publicVotesTeam2;

  let team1JuryScore = 0;
  let team2JuryScore = 0;
  let team1PublicScore = 0;
  let team2PublicScore = 0;
  let team1Final = 0;
  let team2Final = 0;

  if (publicTotal > 0) {
    const juryVoteWeight = 60 / juryMembersCount;

    team1JuryScore = juryVotesTeam1 * juryVoteWeight;
    team2JuryScore = juryVotesTeam2 * juryVoteWeight;
    team1PublicScore = (publicVotesTeam1 / publicTotal) * 40;
    team2PublicScore = (publicVotesTeam2 / publicTotal) * 40;

    team1Final = team1JuryScore + team1PublicScore;
    team2Final = team2JuryScore + team2PublicScore;
  } else {
    const juryVotesCast = juryVotesTeam1 + juryVotesTeam2;

    team1Final = (juryVotesTeam1 / juryVotesCast) * 100;
    team2Final = (juryVotesTeam2 / juryVotesCast) * 100;

    team1JuryScore = team1Final;
    team2JuryScore = team2Final;
  }

  const roundedTeam1Final = round1(team1Final);
  const roundedTeam2Final = round1(team2Final);
  const isTie = roundedTeam1Final === roundedTeam2Final;

  return {
    team1Final: roundedTeam1Final,
    team2Final: roundedTeam2Final,
    team1JuryScore: round1(team1JuryScore),
    team2JuryScore: round1(team2JuryScore),
    team1PublicScore: round1(team1PublicScore),
    team2PublicScore: round1(team2PublicScore),
    winnerSide: isTie
      ? null
      : roundedTeam1Final > roundedTeam2Final
        ? "team1"
        : "team2",
    isTie,
    usedPublicVotes: publicTotal > 0,
  };
}
