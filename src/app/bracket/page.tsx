"use client"
import { useEffect, useState } from "react"
import { TeamAvatar } from "@/components/common/team-avatar"
import { getChallengePhaseLabel } from "@/lib/labels"

interface BracketMatch {
  id: string
  name: string
  order: number
  status: string
  phase: string
  winnerId: string | null
  team1FinalScore: number | null
  team2FinalScore: number | null
  team1: { id: string; name: string; imageUrl: string | null } | null
  team2: { id: string; name: string; imageUrl: string | null } | null
}

export default function BracketPage() {
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/public/bracket")
      .then(r => r.json())
      .then(j => {
        if (j.data) setMatches(j.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="text-6xl">📭</div>
          <div className="text-2xl font-bold">لا توجد تحديات حالياً</div>
          <p className="text-gray-400">لم يتم إنشاء أي تحديات بعد</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl md:text-4xl font-black text-center mb-8">🏆 شجرة المنافسة</h1>

        <div className="space-y-4">
          {matches.map((match) => {
            const t1Wins = match.winnerId && match.winnerId === match.team1?.id
            const t2Wins = match.winnerId && match.winnerId === match.team2?.id
            const isActive = match.phase === "PRESENTING" || match.phase === "VOTING" || match.phase === "RESULT"
            const isFinished = match.phase === "FINISHED"

            return (
              <div
                key={match.id}
                className={`rounded-2xl border-2 p-4 md:p-6 ${
                  isActive
                    ? "border-yellow-500 bg-yellow-500/10"
                    : isFinished
                    ? "border-gray-700 bg-gray-900"
                    : "border-gray-800 bg-gray-900/50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">التحدي {match.order}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive
                      ? "bg-yellow-500 text-black"
                      : isFinished
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {isActive ? "قيد التنفيذ" : isFinished ? "منتهي" : getChallengePhaseLabel(match.phase)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl ${
                    t1Wins ? "bg-yellow-500/20 border border-yellow-500" : "bg-gray-800"
                  }`}>
                    <TeamAvatar name={match.team1?.name ?? "---"} imageUrl={match.team1?.imageUrl} size="md" />
                    <div className="font-bold text-lg">{match.team1?.name ?? "---"}</div>
                    {isFinished && match.team1FinalScore != null && (
                      <div className="text-2xl font-black text-blue-400">{match.team1FinalScore}%</div>
                    )}
                    {t1Wins && <div className="text-yellow-400 text-sm">🏆 الفائز</div>}
                  </div>

                  <div className="text-2xl font-black text-gray-500">VS</div>

                  <div className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl ${
                    t2Wins ? "bg-yellow-500/20 border border-yellow-500" : "bg-gray-800"
                  }`}>
                    <TeamAvatar name={match.team2?.name ?? "---"} imageUrl={match.team2?.imageUrl} size="md" />
                    <div className="font-bold text-lg">{match.team2?.name ?? "---"}</div>
                    {isFinished && match.team2FinalScore != null && (
                      <div className="text-2xl font-black text-green-400">{match.team2FinalScore}%</div>
                    )}
                    {t2Wins && <div className="text-yellow-400 text-sm">🏆 الفائز</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
