/**
 * Tests for Phase 1-4: Desynchronization Fix
 * Verifies that:
 * - Expired timers are correctly identified before deriving active team
 * - Display shows correct team even if admin shows different state
 * - No stale presentation team lingers after finalization
 */

import { computePresentationSnapshot, deriveActivePresentationTeam } from "@/lib/timer-snapshot"

describe("Desynchronization Fix Tests", () => {
  const now = Date.now()

  describe("Phase 4: Expired Timer Finalization Order", () => {
    it("should treat expired RUNNING timer (remainingSeconds <= 0) as ENDED before deriving active team", () => {
      // Team1 started 20 seconds ago, duration was 10 seconds
      const startedAt = new Date(now - 20000).toISOString()
      
      const team1Snapshot = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      // After 20 seconds, should be expired
      expect(team1Snapshot.status).toBe("ENDED")
      expect(team1Snapshot.remainingSeconds).toBe(0)
    })

    it("team1 ENDED + team2 READY => activePresentationTeam should be WAITING, not TEAM1", () => {
      // Team1 is done (expired)
      const startedAt = new Date(now - 20000).toISOString()
      const team1Snapshot = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      // Team2 hasn't started (READY)
      const team2Snapshot = computePresentationSnapshot({
        status: "READY",
        remainingSeconds: 10,
        startedAt: null,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      const votingSnapshot = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      expect(team1Snapshot.status).toBe("ENDED")
      expect(team2Snapshot.status).toBe("IDLE")

      const active = deriveActivePresentationTeam(team1Snapshot, team2Snapshot, votingSnapshot, "PRESENTING")
      expect(active).toBe("WAITING")
    })

    it("team1 ENDED + team2 RUNNING => activePresentationTeam should be TEAM2", () => {
      // Team1 is done (expired)
      const startedAt1 = new Date(now - 20000).toISOString()
      const team1Snapshot = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: startedAt1,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      // Team2 is actively running (started just now)
      const startedAt2 = new Date(now - 2000).toISOString()
      const team2Snapshot = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: startedAt2,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      const votingSnapshot = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      expect(team1Snapshot.status).toBe("ENDED")
      expect(team2Snapshot.status).toBe("SCHEDULED") // Within 3-second ramp-up

      const active = deriveActivePresentationTeam(team1Snapshot, team2Snapshot, votingSnapshot, "PRESENTING")
      expect(active).toBe("TEAM2")
    })

    it("team1 ENDED + team2 PAUSED => activePresentationTeam should be TEAM2", () => {
      // Team1 is done
      const startedAt1 = new Date(now - 20000).toISOString()
      const team1Snapshot = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: startedAt1,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      // Team2 is paused
      const team2Snapshot = computePresentationSnapshot({
        status: "PAUSED",
        remainingSeconds: 5,
        startedAt: null,
        pausedAt: new Date(now - 1000).toISOString(),
        durationSeconds: 10,
      }, now)

      const votingSnapshot = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      expect(team1Snapshot.status).toBe("ENDED")
      expect(team2Snapshot.status).toBe("PAUSED")

      const active = deriveActivePresentationTeam(team1Snapshot, team2Snapshot, votingSnapshot, "PRESENTING")
      expect(active).toBe("TEAM2")
    })
  })

  describe("Phase 3: Same Endpoint Verification", () => {
    it("computePresentationSnapshot returns consistent ENDED status for expired timers regardless of call order", () => {
      const startedAt = new Date(now - 20000).toISOString()
      
      // First call
      const snapshot1 = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      // Second call with same data
      const snapshot2 = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      expect(snapshot1.status).toBe("ENDED")
      expect(snapshot2.status).toBe("ENDED")
      expect(snapshot1.status).toBe(snapshot2.status)
      expect(snapshot1.remainingSeconds).toBe(snapshot2.remainingSeconds)
    })
  })

  describe("No Stale State After Finalization", () => {
    it("when team1 finishes naturally (expired), subsequent polls show WAITING with team1 not active", () => {
      // Simulate team1 expiring
      const team1StartedAt = new Date(now - 20000).toISOString()
      
      // First poll: team1 still running (but will be computed as expired)
      const team1SnapshotAfterExpiry = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: team1StartedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      expect(team1SnapshotAfterExpiry.status).toBe("ENDED")
      
      // Team2 hasn't started
      const team2Snapshot = {
        status: "IDLE" as const,
        durationSeconds: 10,
        remainingSeconds: 10,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      const votingSnapshot = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      // Derive active team
      const activeTeam = deriveActivePresentationTeam(team1SnapshotAfterExpiry, team2Snapshot, votingSnapshot, "PRESENTING")
      
      expect(activeTeam).toBe("WAITING")
      expect(activeTeam).not.toBe("TEAM1")
    })

    it("when admin resets team1 timer, display should show WAITING immediately on next poll", () => {
      // Team1 after reset: back to IDLE/READY
      const team1Snapshot = {
        status: "IDLE" as const,
        durationSeconds: 10,
        remainingSeconds: 10,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      // Team2 also IDLE
      const team2Snapshot = {
        status: "IDLE" as const,
        durationSeconds: 10,
        remainingSeconds: 10,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      const votingSnapshot = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      const activeTeam = deriveActivePresentationTeam(team1Snapshot, team2Snapshot, votingSnapshot, "PRESENTING")
      expect(activeTeam).toBe("WAITING")
    })
  })

  describe("Display Polling Consistency", () => {
    it("multiple rapid polls should return consistent active team for same backend state", () => {
      // Simulate backend state
      const team1StartedAt = new Date(now - 5000).toISOString()
      const team1Snapshot1 = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: team1StartedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      const team1Snapshot2 = computePresentationSnapshot({
        status: "RUNNING",
        remainingSeconds: 10,
        startedAt: team1StartedAt,
        pausedAt: null,
        durationSeconds: 10,
      }, now)

      const team2 = {
        status: "IDLE" as const,
        durationSeconds: 10,
        remainingSeconds: 10,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      const voting = {
        status: "IDLE" as const,
        durationSeconds: 120,
        remainingSeconds: 120,
        startsAt: null,
        startedAt: null,
        pausedAt: null,
        serverNow: new Date(now).toISOString(),
      }

      const active1 = deriveActivePresentationTeam(team1Snapshot1, team2, voting, "PRESENTING")
      const active2 = deriveActivePresentationTeam(team1Snapshot2, team2, voting, "PRESENTING")

      expect(active1).toBe(active2)
      expect(active1).toBe("TEAM1")
    })
  })
})
