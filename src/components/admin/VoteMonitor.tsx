import React from "react"
import type { ChallengePublic } from "@/types/domain.types"

export function VoteMonitor({
  challenge,
  counts,
}: {
  challenge: ChallengePublic
  counts: {
    team1Public: number
    team2Public: number
    totalPublic: number
    team1Jury: number
    team2Jury: number
    totalJury: number
  } | null
}) {
  const t1PublicPct = counts && counts.totalPublic > 0
    ? Math.round((counts.team1Public / counts.totalPublic) * 100)
    : 0
  const t2PublicPct = counts && counts.totalPublic > 0
    ? 100 - t1PublicPct
    : 0
  const t1JuryPct = counts && counts.totalJury > 0
    ? Math.round((counts.team1Jury / counts.totalJury) * 100)
    : 0
  const t2JuryPct = counts && counts.totalJury > 0
    ? 100 - t1JuryPct
    : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <h3 className="font-bold text-gray-900">مراقبة التصويت</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">تصويت الجمهور</p>
          <div className="flex justify-between text-sm">
            <span>{challenge.team1?.name ?? "الفريق 1"}</span>
            <span className="font-bold">{counts?.team1Public ?? 0} ({t1PublicPct}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{challenge.team2?.name ?? "الفريق 2"}</span>
            <span className="font-bold">{counts?.team2Public ?? 0} ({t2PublicPct}%)</span>
          </div>
          <p className="text-xs text-gray-400">المجموع: {counts?.totalPublic ?? 0}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500">تصويت اللجنة</p>
          <div className="flex justify-between text-sm">
            <span>{challenge.team1?.name ?? "الفريق 1"}</span>
            <span className="font-bold">{counts?.team1Jury ?? 0} ({t1JuryPct}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{challenge.team2?.name ?? "الفريق 2"}</span>
            <span className="font-bold">{counts?.team2Jury ?? 0} ({t2JuryPct}%)</span>
          </div>
          <p className="text-xs text-gray-400">المجموع: {counts?.totalJury ?? 0}</p>
        </div>
      </div>

      {challenge.phase === "RESULT" && challenge.team1FinalScore != null && (
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <p className="text-xs text-gray-500">النتيجة النهائية (الجمهور 40% + اللجنة 60%)</p>
          <div className="flex justify-between text-sm font-bold">
            <span>{challenge.team1?.name}</span>
            <span className="text-blue-600">{challenge.team1FinalScore}%</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>{challenge.team2?.name}</span>
            <span className="text-green-600">{challenge.team2FinalScore}%</span>
          </div>
          <p className="text-xs text-gray-400">
            الفائز: {challenge.winnerId === challenge.team1?.id ? challenge.team1?.name : challenge.team2?.name}
          </p>
        </div>
      )}
    </div>
  )
}
