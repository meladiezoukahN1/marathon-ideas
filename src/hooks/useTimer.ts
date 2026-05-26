"use client"
import { useEffect, useState } from "react"
import { useSocket } from "./useSocket"
import type { TimerTickPayload } from "@/types/socket.types"

export function useTimer(challengeId: string, initialSecs = 600) {
  const { socket } = useSocket()
  const [secs, setSecs] = useState(initialSecs)

  useEffect(() => { setSecs(initialSecs) }, [initialSecs])

  useEffect(() => {
    if (!socket) return
    const handler = (d: TimerTickPayload) => {
      if (d.challengeId === challengeId) setSecs(d.secondsLeft)
    }
    socket.on("timer:tick", handler)
    return () => { socket.off("timer:tick", handler) }
  }, [socket, challengeId])

  const m = String(Math.floor(Math.max(0, secs) / 60)).padStart(2, "0")
  const s = String(Math.max(0, secs) % 60).padStart(2, "0")
  return { secondsLeft: secs, display: `${m}:${s}`, isWarning: secs <= 60 && secs > 15, isDanger: secs <= 15 }
}
