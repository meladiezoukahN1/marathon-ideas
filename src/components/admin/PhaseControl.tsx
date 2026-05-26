import React, { useState, useEffect } from "react"
import { getChallengePhaseLabel } from "@/lib/labels"
import type { ChallengePublic } from "@/types/domain.types"

function formatCountdown(seconds: number): string {
  const m = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")
  const s = String(Math.max(0, seconds) % 60).padStart(2, "0")
  return `${m}:${s}`
}

const NEXT_PHASE: Record<string, string> = {
  WAITING: "PRESENTING",
  PRESENTING: "VOTING",
  VOTING: "RESULT",
  RESULT: "FINISHED",
}

export function PhaseControl({
  challenge,
  onPhase,
  onReveal,
  onCalculateResult,
  isLoading,
}: {
  challenge: ChallengePublic
  onPhase: (phase: string, votingDurationSeconds?: number) => void
  onReveal: () => void
  onCalculateResult: () => void
  isLoading: boolean
}) {
  const [countdown, setCountdown] = useState(0)

  const canAdvance = challenge.phase === "WAITING" ||
    challenge.phase === "VOTING" ||
    challenge.phase === "RESULT"

  // Don't show next-phase button for PRESENTING → VOTING transition;
  // admin uses the explicit "بدء التصويت" button in the main dashboard instead.
  const showNextPhase = challenge.phase !== "PRESENTING"

  const nextPhase = NEXT_PHASE[challenge.phase]

  useEffect(() => {
    if (challenge.phase !== "VOTING" || !challenge.votingEndsAt) return
    const iv = setInterval(() => {
      const remaining = Math.floor((new Date(challenge.votingEndsAt!).getTime() - Date.now()) / 1000)
      setCountdown(Math.max(0, remaining))
    }, 1000)
    return () => clearInterval(iv)
  }, [challenge.phase, challenge.votingEndsAt])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-bold text-gray-900">مراحل التحدي</h3>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white">
          {getChallengePhaseLabel(challenge.phase)}
        </div>
        {showNextPhase && nextPhase && (
          <>
            <span className="text-gray-400">→</span>
            <button
              onClick={() => onPhase(nextPhase)}
              disabled={isLoading || !canAdvance}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition ${
                nextPhase === "RESULT" ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                nextPhase === "FINISHED" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" :
                "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {getChallengePhaseLabel(nextPhase)}
            </button>
          </>
        )}
      </div>

      {challenge.phase === "VOTING" && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-sm text-gray-500">الوقت المتبقي للتصويت</p>
            <p className={`text-3xl font-mono font-bold ${countdown > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatCountdown(countdown)}
            </p>
          </div>
          <button
            onClick={onCalculateResult}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
          >
            اعتماد النتيجة المحسوبة
          </button>
          <button
            onClick={onReveal}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-purple-700 transition"
          >
            عرض النتيجة على الشاشة
          </button>
        </div>
      )}

      {challenge.phase === "RESULT" && (
        <div className="space-y-2">
          {challenge.winnerId ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-emerald-800 font-bold">✓ تم إعلان النتيجة</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-yellow-800 font-bold">⚠ تعادل — لا يوجد فائز</p>
            </div>
          )}
          <button
            onClick={onReveal}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-purple-700 transition"
          >
            عرض النتيجة على الشاشة
          </button>
        </div>
      )}

      {challenge.phase === "FINISHED" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-gray-600 font-bold">✓ التحدي منتهي — استخدم إعادة الضبط للبدء من جديد</p>
        </div>
      )}
    </div>
  )
}
