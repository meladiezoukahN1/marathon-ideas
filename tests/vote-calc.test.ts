import { describe, expect, it } from "vitest";

import {
  calculateFinalVote,
  VoteCalculationError,
} from "../src/lib/vote-calc";

describe("calculateFinalVote", () => {
  it("handles 5 jury users with public votes", () => {
    const result = calculateFinalVote({
      juryMembersCount: 5,
      juryVotesTeam1: 3,
      juryVotesTeam2: 2,
      publicVotesTeam1: 60,
      publicVotesTeam2: 40,
    });

    expect(result.team1Final).toBe(60);
    expect(result.team2Final).toBe(40);
    expect(result.usedPublicVotes).toBe(true);
    expect(result.winnerSide).toBe("team1");
  });

  it("handles 6 jury users with public votes", () => {
    const result = calculateFinalVote({
      juryMembersCount: 6,
      juryVotesTeam1: 4,
      juryVotesTeam2: 2,
      publicVotesTeam1: 45,
      publicVotesTeam2: 55,
    });

    expect(result.team1Final).toBe(58);
    expect(result.team2Final).toBe(42);
  });

  it("handles arbitrary active jury count", () => {
    const result = calculateFinalVote({
      juryMembersCount: 9,
      juryVotesTeam1: 5,
      juryVotesTeam2: 4,
      publicVotesTeam1: 30,
      publicVotesTeam2: 70,
    });

    expect(result.team1Final).toBe(45.3);
    expect(result.team2Final).toBe(54.7);
  });

  it("normalizes to 100 when there are no public votes", () => {
    const result = calculateFinalVote({
      juryMembersCount: 7,
      juryVotesTeam1: 5,
      juryVotesTeam2: 2,
      publicVotesTeam1: 0,
      publicVotesTeam2: 0,
    });

    expect(result.usedPublicVotes).toBe(false);
    expect(result.team1Final).toBe(71.4);
    expect(result.team2Final).toBe(28.6);
    expect(result.team1PublicScore).toBe(0);
    expect(result.team2PublicScore).toBe(0);
  });

  it("rejects zero jury members", () => {
    expect(() =>
      calculateFinalVote({
        juryMembersCount: 0,
        juryVotesTeam1: 1,
        juryVotesTeam2: 0,
        publicVotesTeam1: 0,
        publicVotesTeam2: 0,
      }),
    ).toThrow(VoteCalculationError);
  });

  it("rejects zero jury votes cast", () => {
    expect(() =>
      calculateFinalVote({
        juryMembersCount: 5,
        juryVotesTeam1: 0,
        juryVotesTeam2: 0,
        publicVotesTeam1: 10,
        publicVotesTeam2: 20,
      }),
    ).toThrow(VoteCalculationError);
  });

  it("rejects jury votes greater than jury members", () => {
    expect(() =>
      calculateFinalVote({
        juryMembersCount: 5,
        juryVotesTeam1: 4,
        juryVotesTeam2: 2,
        publicVotesTeam1: 10,
        publicVotesTeam2: 20,
      }),
    ).toThrow(VoteCalculationError);
  });

  it("rejects negative votes", () => {
    expect(() =>
      calculateFinalVote({
        juryMembersCount: 5,
        juryVotesTeam1: -1,
        juryVotesTeam2: 2,
        publicVotesTeam1: 0,
        publicVotesTeam2: 0,
      }),
    ).toThrow(VoteCalculationError);
  });

  it("returns tie without automatic winner", () => {
    const result = calculateFinalVote({
      juryMembersCount: 5,
      juryVotesTeam1: 3,
      juryVotesTeam2: 2,
      publicVotesTeam1: 35,
      publicVotesTeam2: 65,
    });

    expect(result.isTie).toBe(true);
    expect(result.winnerSide).toBeNull();
  });

  it("rounds floating values to one decimal", () => {
    const result = calculateFinalVote({
      juryMembersCount: 6,
      juryVotesTeam1: 5,
      juryVotesTeam2: 1,
      publicVotesTeam1: 1,
      publicVotesTeam2: 2,
    });

    expect(result.team1JuryScore).toBe(50);
    expect(result.team1PublicScore).toBe(13.3);
    expect(result.team1Final).toBe(63.3);
  });

  it("applies public score as 40 percent only", () => {
    const result = calculateFinalVote({
      juryMembersCount: 4,
      juryVotesTeam1: 2,
      juryVotesTeam2: 2,
      publicVotesTeam1: 100,
      publicVotesTeam2: 0,
    });

    expect(result.team1PublicScore).toBe(40);
    expect(result.team2PublicScore).toBe(0);
  });

  it("applies jury weight as 60 divided by active jury count", () => {
    const result = calculateFinalVote({
      juryMembersCount: 8,
      juryVotesTeam1: 6,
      juryVotesTeam2: 2,
      publicVotesTeam1: 0,
      publicVotesTeam2: 10,
    });

    expect(result.team1JuryScore).toBe(45);
    expect(result.team2JuryScore).toBe(15);
  });
});
