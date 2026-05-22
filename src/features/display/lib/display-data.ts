import type { EventStateResponse } from "@/shared/types/api.types";
import type { BracketNode, MatchPublic } from "@/shared/types/domain.types";

import type {
  DisplayDataResult,
  DisplayViewModel,
  SupportedDisplayMode,
  TeamPresentationModel,
  VotingDisplayModel,
  WinnerRevealModel,
} from "../types";

const SUPPORTED_MODES: SupportedDisplayMode[] = [
  "EVENT_WAITING",
  "BRACKET_PREVIEW",
  "PRESENTING_TEAM",
  "VOTING",
  "VOTING_CLOSED",
  "WINNER_REVEAL",
  "BRACKET_UPDATE",
  "FINAL_BRACKET",
  "EVENT_FINISHED",
];

function normalizeMode(input: string | undefined): SupportedDisplayMode {
  if (input && SUPPORTED_MODES.includes(input as SupportedDisplayMode)) {
    return input as SupportedDisplayMode;
  }
  return "EVENT_WAITING";
}

function sortByChallengeOrder(matches: MatchPublic[]): MatchPublic[] {
  return [...matches].sort((a, b) => a.challenge.order - b.challenge.order);
}

function deriveBracketNodes(matches: MatchPublic[]): BracketNode[] {
  return matches.map((match) => ({
    challenge: match.challenge,
    team1: match.team1,
    team2: match.team2,
    winner: match.winner,
    isCompleted: Boolean(match.winner),
  }));
}

function resolveCurrentMatch(matches: MatchPublic[], currentMatchId: string | null): MatchPublic | null {
  if (matches.length === 0) return null;
  if (!currentMatchId) return matches[0] ?? null;
  return matches.find((match) => match.id === currentMatchId) ?? matches[0] ?? null;
}

function resolveTeamPresentation(match: MatchPublic | null): TeamPresentationModel | null {
  if (!match) return null;
  const team = match.phase === "PRESENTING_TEAM2" ? match.team2 : match.team1;
  return {
    challengeName: match.challenge.nameAr,
    team,
    timerSecs: match.timerSecs,
  };
}

function resolveVotingDisplay(match: MatchPublic | null, voteClosed: boolean): VotingDisplayModel | null {
  if (!match) return null;
  return {
    challengeName: match.challenge.nameAr,
    team1: match.team1,
    team2: match.team2,
    timerSecs: match.timerSecs,
    voteClosed,
  };
}

function resolveWinnerReveal(match: MatchPublic | null): WinnerRevealModel | null {
  if (!match) return null;
  return {
    challengeName: match.challenge.nameAr,
    winner: match.winner,
    team1Score: match.publicVotesTeam1 + match.juryVotesTeam1,
    team2Score: match.publicVotesTeam2 + match.juryVotesTeam2,
  };
}

function toViewModel(response: NonNullable<EventStateResponse["data"]>): DisplayViewModel {
  const orderedMatches = sortByChallengeOrder(response.matches);
  const currentMatch = resolveCurrentMatch(orderedMatches, response.currentMatchId);
  const mode = normalizeMode(response.displayMode);

  return {
    mode,
    eventState: {
      ...response,
      matches: orderedMatches,
    },
    currentMatch,
    bracketNodes: deriveBracketNodes(orderedMatches),
    teamPresentation: resolveTeamPresentation(currentMatch),
    votingDisplay: resolveVotingDisplay(currentMatch, mode === "VOTING_CLOSED"),
    winnerReveal: resolveWinnerReveal(currentMatch),
  };
}

export async function getDisplayData(): Promise<DisplayDataResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return { status: "missing_app_url" };
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/event/state`, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        status: "error",
        message: "تعذر جلب حالة الحدث.",
      };
    }

    const payload = (await response.json()) as EventStateResponse;

    if (payload.error) {
      return {
        status: "error",
        message: payload.error,
      };
    }

    if (!payload.data || payload.data.matches.length === 0) {
      return {
        status: "empty",
        message: "لا توجد بيانات عرض متاحة حالياً.",
      };
    }

    return {
      status: "ok",
      view: toViewModel(payload.data),
    };
  } catch {
    return {
      status: "error",
      message: "حدث خطأ أثناء تحميل شاشة العرض.",
    };
  }
}
