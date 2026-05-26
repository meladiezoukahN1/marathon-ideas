"use client"
import { useEffect, useState, useCallback } from "react"
import type { TimerState } from "@/types/domain.types"

function calculateLiveRemaining(timer: TimerState): number {
  if (timer.status !== "RUNNING" || !timer.startedAt) {
    return Math.max(0, timer.remainingSeconds)
  }
  const now = Date.now()
  const started = new Date(timer.startedAt).getTime()
  const elapsed = Math.floor((now - started) / 1000)
  return Math.max(0, timer.remainingSeconds - elapsed)
}

export function useLiveTimer(timer: TimerState | undefined) {
  const [displayRemaining, setDisplayRemaining] = useState(() =>
    timer ? calculateLiveRemaining(timer) : 0,
  )
  const [displayStatus, setDisplayStatus] = useState(timer?.status ?? "READY")

  const recalc = useCallback(() => {
    if (!timer) return
    const remaining = calculateLiveRemaining(timer)
    setDisplayRemaining(remaining)
    if (timer.status === "RUNNING" && remaining <= 0) {
      setDisplayStatus("FINISHED")
    } else {
      setDisplayStatus(timer.status)
    }
  }, [timer])

  useEffect(() => {
    recalc()
  }, [recalc])

  useEffect(() => {
    const iv = setInterval(recalc, 1000)
    return () => clearInterval(iv)
  }, [recalc])

  const m = String(Math.floor(Math.max(0, displayRemaining) / 60)).padStart(2, "0")
  const s = String(Math.max(0, displayRemaining) % 60).padStart(2, "0")

  return {
    remainingSeconds: displayRemaining,
    status: displayStatus,
    display: `${m}:${s}`,
    isWarning: displayRemaining <= 60 && displayRemaining > 15,
    isDanger: displayRemaining <= 15,
    isFinished: displayStatus === "FINISHED" || displayRemaining <= 0,
  }
}
