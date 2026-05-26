"use client"

/**
 * Lightweight fingerprint — no external library.
 * Good enough for a live event: stops casual double-voting.
 * Real guarantee is the DB @@unique constraint.
 */
export function generateVoterToken(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? 0),
    String(navigator.maxTouchPoints ?? 0),
  ]
  const raw = parts.join("||")
  let h = 5381
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i)
  }
  return Math.abs(h >>> 0).toString(36).padStart(8, "0")
}

export function hasVotedLocally(challengeId: string, voteSessionId?: string | null): boolean {
  if (typeof window === "undefined") return false
  const key = `voted:${challengeId}`
  const stored = localStorage.getItem(key)
  if (!stored) return false
  // If voteSessionId is provided and doesn't match stored value, the vote is stale (challenge was reset)
  if (voteSessionId !== undefined && stored !== voteSessionId) {
    localStorage.removeItem(key)
    return false
  }
  return true
}

export function markVotedLocally(challengeId: string, voteSessionId?: string | null): void {
  if (typeof window === "undefined") return
  // Store a session identifier so we can detect resets
  localStorage.setItem(`voted:${challengeId}`, voteSessionId || "1")
}
