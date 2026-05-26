import { calcResult } from "../src/lib/vote-calc"

describe("calcResult", () => {
  it("normal: jury 4-1, public 60-40", () => {
    const r = calcResult({ juryForTeam1: 4, juryForTeam2: 1, publicForTeam1: 60, publicForTeam2: 40 })
    expect(r.team1JuryPct).toBe(80)
    expect(r.team1PublicPct).toBe(60)
    // 80*0.6 + 60*0.4 = 48 + 24 = 72
    expect(r.team1Final).toBe(72)
    expect(r.winnerId).toBe("team1")
  })
  it("jury sweep 5-0, public loses 0-100", () => {
    const r = calcResult({ juryForTeam1: 5, juryForTeam2: 0, publicForTeam1: 0, publicForTeam2: 100 })
    // 100*0.6 + 0*0.4 = 60
    expect(r.team1Final).toBe(60)
    expect(r.winnerId).toBe("team1")
  })
  it("zero public: 50/50 default", () => {
    const r = calcResult({ juryForTeam1: 3, juryForTeam2: 2, publicForTeam1: 0, publicForTeam2: 0 })
    expect(r.team1PublicPct).toBe(50)
    // 60*0.6 + 50*0.4 = 36+20 = 56
    expect(r.team1Final).toBe(56)
  })
  it("exact tie: team1 wins", () => {
    const r = calcResult({ juryForTeam1: 2, juryForTeam2: 2, publicForTeam1: 100, publicForTeam2: 100 })
    expect(r.team1Final).toBe(50)
    expect(r.winnerId).toBe("team1")
  })
  it("team2 wins", () => {
    const r = calcResult({ juryForTeam1: 1, juryForTeam2: 4, publicForTeam1: 30, publicForTeam2: 70 })
    expect(r.winnerId).toBe("team2")
  })
  it("totals always 100", () => {
    const r = calcResult({ juryForTeam1: 3, juryForTeam2: 2, publicForTeam1: 55, publicForTeam2: 45 })
    expect(r.team1Final + r.team2Final).toBe(100)
  })
})
