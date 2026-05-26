import { create } from "zustand"
import type { ChallengePublic, EventPublic } from "@/types/domain.types"
import type { ResultRevealPayload } from "@/types/socket.types"

interface EventStore {
  event:          EventPublic | null
  challenges:     ChallengePublic[]
  activeChallengeId: string | null
  results:        Record<string, ResultRevealPayload>
  setEvent:       (e: EventPublic) => void
  setChallenges:  (c: ChallengePublic[]) => void
  setActiveChallenge: (id: string) => void
  updateChallenge: (id: string, patch: Partial<ChallengePublic>) => void
  setResult:      (r: ResultRevealPayload) => void
}

export const useEventStore = create<EventStore>((set) => ({
  event:          null,
  challenges:     [],
  activeChallengeId: null,
  results:        {},
  setEvent:       (event) => set({ event }),
  setChallenges:  (challenges) => set({ challenges, activeChallengeId: challenges[0]?.id ?? null }),
  setActiveChallenge: (activeChallengeId) => set({ activeChallengeId }),
  updateChallenge: (id, patch) =>
    set(s => ({ challenges: s.challenges.map(c => c.id === id ? { ...c, ...patch } : c) })),
  setResult: (r) => set(s => ({ results: { ...s.results, [r.challengeId]: r } })),
}))
