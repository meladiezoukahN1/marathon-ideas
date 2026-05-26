"use client"
import { useEffect, useState } from "react"
import { useSocket } from "./useSocket"
import type { VoteCountPayload } from "@/types/socket.types"

const INIT: VoteCountPayload = { challengeId: "", team1Count: 0, team2Count: 0, total: 0, juryCount: 0 }

export function useVoteCount(challengeId: string) {
  const { socket } = useSocket()
  const [counts, setCounts] = useState<VoteCountPayload>(INIT)

  useEffect(() => {
    if (!socket) return
    const handler = (d: VoteCountPayload) => {
      if (d.challengeId === challengeId) setCounts(d)
    }
    socket.on("vote:count", handler)
    return () => { socket.off("vote:count", handler) }
  }, [socket, challengeId])

  return counts
}
