import { NotFoundError } from "@/server/core/errors";
import type { BracketState, EventState, MatchPublic } from "@/shared/types/domain.types";

import { getBracketRepositorySnapshot } from "./repository";
import type { BracketMatchRow, VoteCountRow } from "./types";

function buildVoteCountMap(rows: VoteCountRow[]): Map<string, number> {
  return new Map(rows.map((row) => [`${row.matchId}:${row.teamId}`, row.count]));
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapMatchPublic(
  match: BracketMatchRow,
  publicCounts: Map<string, number>,
  juryCounts: Map<string, number>,
): MatchPublic {
  const publicTeam1 = publicCounts.get(`${match.id}:${match.team1.id}`) ?? 0;
  const publicTeam2 = publicCounts.get(`${match.id}:${match.team2.id}`) ?? 0;
  const juryTeam1 = juryCounts.get(`${match.id}:${match.team1.id}`) ?? 0;
  const juryTeam2 = juryCounts.get(`${match.id}:${match.team2.id}`) ?? 0;

  return {
    id: match.id,
    challengeId: match.challengeId,
    challenge: {
      id: "",
      slug: "",
      nameAr: "",
      order: 0,
    },
    phase: match.phase,
    resultStatus: match.resultStatus,
    timerSecs: match.timerSecs,
    timerActive: match.timerActive,
    voteOpenAt: toIsoString(match.voteOpenAt),
    voteCloseAt: toIsoString(match.voteCloseAt),
    resultShownAt: toIsoString(match.resultShownAt),
    team1: {
      id: match.team1.id,
      nameAr: match.team1.nameAr,
      ideaAr: match.team1.ideaAr,
    },
    team2: {
      id: match.team2.id,
      nameAr: match.team2.nameAr,
      ideaAr: match.team2.ideaAr,
    },
    winner: match.winner
      ? {
          id: match.winner.id,
          nameAr: match.winner.nameAr,
          ideaAr: match.winner.ideaAr,
        }
      : null,
    publicVotesTeam1: publicTeam1,
    publicVotesTeam2: publicTeam2,
    juryVotesTeam1: juryTeam1,
    juryVotesTeam2: juryTeam2,
  };
}

export async function getBracketState(): Promise<BracketState> {
  const snapshot = await getBracketRepositorySnapshot();

  const nodes = snapshot.challenges
    .filter((challenge) => challenge.match !== null)
    .map((challenge) => ({
      challenge: {
        id: challenge.id,
        slug: challenge.slug,
        nameAr: challenge.nameAr,
        order: challenge.order,
      },
      team1: {
        id: challenge.match!.team1.id,
        nameAr: challenge.match!.team1.nameAr,
        ideaAr: challenge.match!.team1.ideaAr,
      },
      team2: {
        id: challenge.match!.team2.id,
        nameAr: challenge.match!.team2.nameAr,
        ideaAr: challenge.match!.team2.ideaAr,
      },
      winner: challenge.match!.winner
        ? {
            id: challenge.match!.winner.id,
            nameAr: challenge.match!.winner.nameAr,
            ideaAr: challenge.match!.winner.ideaAr,
          }
        : null,
      isCompleted: Boolean(challenge.match!.winner),
    }));

  const completedMatchIds = snapshot.challenges
    .filter((challenge) => challenge.match && challenge.match.winner)
    .map((challenge) => challenge.match!.id);

  return {
    currentMatchId: snapshot.eventControl?.currentMatchId ?? null,
    completedMatchIds,
    nodes,
  };
}

export async function getEventState(): Promise<EventState> {
  const snapshot = await getBracketRepositorySnapshot();

  if (!snapshot.eventControl) {
    throw new NotFoundError("Event control record not found");
  }

  const publicCounts = buildVoteCountMap(snapshot.publicVoteCounts);
  const juryCounts = buildVoteCountMap(snapshot.juryVoteCounts);

  const matches = snapshot.challenges
    .filter((challenge) => challenge.match !== null)
    .map((challenge) => {
      const mapped = mapMatchPublic(challenge.match!, publicCounts, juryCounts);
      return {
        ...mapped,
        challenge: {
          id: challenge.id,
          slug: challenge.slug,
          nameAr: challenge.nameAr,
          order: challenge.order,
        },
      };
    });

  return {
    displayMode: snapshot.eventControl.displayMode,
    currentMatchId: snapshot.eventControl.currentMatchId,
    matches,
  };
}
