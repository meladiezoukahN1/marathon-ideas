"use client"

import React, { useState, useCallback } from "react"
import { useLiveTimer } from "@/hooks/useLiveTimer"
import { getTimerStatusLabel } from "@/lib/labels"
import type { ChallengePublic, TimerState } from "@/types/domain.types"

function TimerPanel({
  label,
  timer,
  onStart,
  onPause,
  onReset,
  onAdd,
  onSubtract,
  onSet,
  disabled,
}: {
  label: string
  timer: TimerState
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onAdd: (seconds: number) => void
  onSubtract: (seconds: number) => void
  onSet: (seconds: number) => void
  disabled: boolean
}) {
  const live = useLiveTimer(timer)
  const [inputValue, setInputValue] = useState("")
  const isRunning = live.status === "RUNNING"
  const isFinished = live.status === "FINISHED"

  React.useEffect(() => {
    console.log("[ADMIN_TIMER_RENDER_VALUE]", JSON.stringify({
      team: label,
      displayedRemaining: live.remainingSeconds,
      displayedValue: live.display,
      displayedStatus: live.status,
      dbTimerStatus: timer.status,
      dbTimerRemainingSeconds: timer.remainingSeconds,
      dbTimerDurationSeconds: timer.durationSeconds,
      dbTimerStartedAt: timer.startedAt,
      calculatedElapsed: timer.startedAt && timer.status === "RUNNING" ? Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000) : null,
      derived: "from useLiveTimer (remainingSeconds - elapsed)",
    }))
  }, [timer, live])

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
        <span className="font-bold text-gray-900">{label}</span>
        <span className={`text-3xl font-mono font-bold ${
          isFinished ? "text-red-600" : isRunning ? "text-green-600" : "text-gray-700"
        }`}>
          {live.display}
        </span>
      </div>
      <div className="text-xs text-gray-500">الحالة: {getTimerStatusLabel(live.status)}</div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onStart}
          disabled={disabled || isRunning || isFinished}
          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition"
        >
          تشغيل
        </button>
        <button
          onClick={onPause}
          disabled={disabled || !isRunning}
          className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition"
        >
          إيقاف مؤقت
        </button>
        <button
          onClick={onReset}
          disabled={disabled}
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
          disabled={disabled || live.remainingSeconds <= 30}
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

export function TimerControl({
  challenge,
  onTimerAction,
  isLoading,
}: {
  challenge: ChallengePublic
  onTimerAction: (action: string, slot: "TEAM1" | "TEAM2", payload?: object) => Promise<void>
  isLoading: boolean
}) {
  const t1 = challenge.team1Timer
  const t2 = challenge.team2Timer

  if (!t1 || !t2) return <div>لا توجد بيانات مؤقت</div>

  return (
    <div className="space-y-4">
      <TimerPanel
        label={challenge.team1?.name ?? "الفريق 1"}
        timer={t1}
        onStart={() => onTimerAction("start", "TEAM1")}
        onPause={() => onTimerAction("pause", "TEAM1")}
        onReset={() => onTimerAction("reset", "TEAM1")}
        onAdd={(s) => onTimerAction("patch", "TEAM1", { deltaSeconds: s })}
        onSubtract={(s) => onTimerAction("patch", "TEAM1", { deltaSeconds: -s })}
        onSet={(s) => onTimerAction("patch", "TEAM1", { remainingSeconds: s })}
        disabled={isLoading}
      />

      <TimerPanel
        label={challenge.team2?.name ?? "الفريق 2"}
        timer={t2}
        onStart={() => onTimerAction("start", "TEAM2")}
        onPause={() => onTimerAction("pause", "TEAM2")}
        onReset={() => onTimerAction("reset", "TEAM2")}
        onAdd={(s) => onTimerAction("patch", "TEAM2", { deltaSeconds: s })}
        onSubtract={(s) => onTimerAction("patch", "TEAM2", { deltaSeconds: -s })}
        onSet={(s) => onTimerAction("patch", "TEAM2", { remainingSeconds: s })}
        disabled={isLoading}
      />
    </div>
  )
}
