"use client"

/**
 * Lightweight fingerprint — no external library.
 * Good enough for a live event: stops casual double-voting.
 * Real guarantee is the server-side Redis SET NX lock scoped to challengeId + votingSessionId.
 *
 * Anonymous voting limitation:
 * One vote per browser voterToken per challenge/session.
 * Does NOT guarantee one vote per real human across browsers/devices.
 * Firefox in anonymous/private mode generates a different voterToken and can vote again.
 * This is expected and acceptable for public anonymous voting.
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

function localKey(challengeId: string, voteSessionId: string): string {
  return `vote:${challengeId}:${voteSessionId}`
}

export function hasVotedLocally(challengeId: string, voteSessionId?: string | null): boolean {
  if (typeof window === "undefined") return false
  if (!voteSessionId) return false
  const key = localKey(challengeId, voteSessionId)
  return localStorage.getItem(key) === "1"
}

export function markVotedLocally(challengeId: string, voteSessionId?: string | null): void {
  if (typeof window === "undefined") return
  if (!voteSessionId) return
  const key = localKey(challengeId, voteSessionId)
  localStorage.setItem(key, "1")
}
