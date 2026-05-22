const VOTE_MARKER_PREFIX = "voted_match_";
const VISITOR_FINGERPRINT_KEY = "marathon_ideas_visitor_fingerprint";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function buildVoteMarkerKey(matchId: string): string {
  return `${VOTE_MARKER_PREFIX}${matchId}`;
}

export function hasVoteMarker(matchId: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    return window.localStorage.getItem(buildVoteMarkerKey(matchId)) === "1";
  } catch {
    return false;
  }
}

export function setVoteMarker(matchId: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(buildVoteMarkerKey(matchId), "1");
  } catch {
    // Intentionally no-op: marker is a UX optimization only.
  }
}

function randomFallbackFingerprint(): string {
  const randomPart = Math.random().toString(36).slice(2);
  return `visitor_${Date.now()}_${randomPart}`;
}

export function getOrCreateVisitorFingerprint(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_FINGERPRINT_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }

    const generated =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : randomFallbackFingerprint();

    if (!generated || generated.trim().length === 0) {
      return null;
    }

    window.localStorage.setItem(VISITOR_FINGERPRINT_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}
