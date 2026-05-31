"use client"

import React, { useState, useEffect, useCallback } from "react"

function formatCountdown(seconds: number): string {
  const m = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")
  const s = String(Math.max(0, seconds) % 60).padStart(2, "0")
  return `${m}:${s}`
}

export function VotingTimerControl({
  votingTimerStatus,
  votingEndsAt,
  votingTimerPausedAt,
  votingDurationSeconds,
  onPause,
  onResume,
  onReset,
  onAdd,
  onSubtract,
  onSet,
  disabled,
}: {
  votingTimerStatus: string
  votingEndsAt: string | null
  votingTimerPausedAt: string | null
  votingDurationSeconds: number
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onAdd: (seconds: number) => void
  onSubtract: (seconds: number) => void
  onSet: (seconds: number) => void
  disabled: boolean
}) {
  const [countdown, setCountdown] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const isRunning = votingTimerStatus === "RUNNING"
  const isPaused = votingTimerStatus === "PAUSED"
  const isFinished = votingTimerStatus === "FINISHED"
  const isReady = votingTimerStatus === "READY"

  useEffect(() => {
    function remaining(): number {
      if (votingEndsAt && isRunning) {
        return Math.max(0, Math.floor((new Date(votingEndsAt).getTime() - Date.now()) / 1000))
      }
      if (votingEndsAt && votingTimerPausedAt && isPaused) {
        return Math.max(0, Math.floor((new Date(votingEndsAt).getTime() - new Date(votingTimerPausedAt).getTime()) / 1000))
      }
      if (isFinished) return 0
      return votingDurationSeconds
    }
    setCountdown(remaining())
    const iv = setInterval(() => { setCountdown(remaining()) }, 1000)
    return () => clearInterval(iv)
  }, [votingTimerStatus, votingEndsAt, votingTimerPausedAt, votingDurationSeconds, isRunning, isPaused, isFinished])

  const handleSet = useCallback(() => {
    const val = parseInt(inputValue, 10)
    if (!isNaN(val) && val >= 0) {
      onSet(val)
      setInputValue("")
    }
  }, [inputValue, onSet])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900">مؤقت التصويت</span>
        <span className={`text-3xl font-mono font-bold ${
          isFinished ? "text-red-600" : isRunning ? "text-green-600" : isPaused ? "text-yellow-600" : "text-gray-700"
        }`}>
          {formatCountdown(countdown)}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        الحالة: {
          isRunning ? "قيد التشغيل" :
          isPaused ? "متوقف مؤقتاً" :
          isFinished ? "منتهي" :
          "جاهز"
        }
      </div>

      <div className="flex flex-wrap gap-2">
        {isPaused && (
          <button
            onClick={onResume}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            استئناف
          </button>
        )}
        {isRunning && (
          <button
            onClick={onPause}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition"
          >
            إيقاف مؤقت
          </button>
        )}
        <button
          onClick={onReset}
          disabled={disabled || isReady}
          className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
        >
          إعادة تعيين
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onAdd(30)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition"
        >
          +30 ث
        </button>
        <button
          onClick={() => onSubtract(30)}
          disabled={disabled || countdown <= 30}
          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100 transition"
        >
          -30 ث
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={0}
          placeholder="ثواني"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
        />
        <button
          onClick={handleSet}
          disabled={disabled || !inputValue}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          تعيين
        </button>
      </div>
    </div>
  )
}
