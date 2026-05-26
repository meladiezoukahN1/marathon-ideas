"use client"
import { useEffect } from "react"
import { useSocket } from "./useSocket"
import type { MatchUpdatePayload, ResultRevealPayload } from "@/types/socket.types"

export function useChallengeUpdates(
  challengeId: string,
  onUpdate: (d: MatchUpdatePayload) => void,
  onResult: (d: ResultRevealPayload) => void,
) {
  const { socket } = useSocket()
  useEffect(() => {
    if (!socket) return
    socket.emit("join:challenge", challengeId)
    socket.on("challenge:update", onUpdate)
    socket.on("result:reveal",    onResult)
    return () => {
      socket.off("challenge:update", onUpdate)
      socket.off("result:reveal",    onResult)
    }
  }, [socket, challengeId, onUpdate, onResult])
}
