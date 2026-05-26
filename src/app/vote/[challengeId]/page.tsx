"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { generateVoterToken, hasVotedLocally, markVotedLocally } from "@/lib/fingerprint"
import { TeamAvatar } from "@/components/common/team-avatar"
import type { ChallengePublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export default function VotePage() {
  const { challengeId } = useParams<{ challengeId: string }>()
  const [challenge, setChallenge]   = useState<ChallengePublic | null>(null)
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<string | null>(null)
  const [voted, setVoted]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState("")
  const [token]                     = useState(() => typeof window !== "undefined" ? generateVoterToken() : "tok")

  useEffect(() => {
    fetch(`/api/challenges?eventId=${EVENT_ID}`)
      .then(r => r.json())
      .then(j => {
        const found = (j.data ?? []).find((c: ChallengePublic) => c.id === challengeId)
        setChallenge(found ?? null)
        if (found && hasVotedLocally(challengeId, found.votingSessionId)) setVoted(true)
      })
      .finally(() => setLoading(false))
  }, [challengeId])

  async function submitVote() {
    if (!selected) return
    setSubmitting(true); setError("")
    const res  = await fetch("/api/votes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, teamId: selected, voterToken: token }),
    })
    const json = await res.json()
    if (json.data?.success || json.error === "ALREADY_VOTED") {
      markVotedLocally(challengeId, challenge?.votingSessionId); setVoted(true)
    } else {
      setError("حدث خطأ، حاول مجدداً")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-xl font-bold text-gray-700">جاري التحميل...</div>
      </div>
    )
  }

  if (!challenge || challenge.phase !== "VOTING") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">🔒</div>
        <div className="text-xl font-bold text-gray-700">التصويت غير مفتوح حالياً</div>
      </div>
    )
  }

  if (voted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">✅</div>
        <div className="text-xl font-bold text-gray-800">تم تسجيل صوتك!</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🗳️</div>
          <h1 className="text-xl font-black text-gray-900">{challenge.name}</h1>
        </div>

        <div className="space-y-4">
          {[challenge.team1, challenge.team2].map(t => t && (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3
                ${selected === t.id
                  ? "border-emerald-500 bg-emerald-50 shadow-lg scale-[1.01]"
                  : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <TeamAvatar name={t.name} imageUrl={t.imageUrl} size="lg" />
              <div className="font-bold text-gray-900 text-lg">{t.name}</div>
              <div className={`w-full py-2 rounded-xl text-sm font-bold transition-colors
                ${selected === t.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {selected === t.id ? "تم الاختيار" : "التصويت لهذا الفريق"}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          onClick={submitVote}
          disabled={!selected || submitting}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
        >
          {submitting ? "جاري التسجيل..." : "تأكيد التصويت"}
        </button>
        <p className="text-gray-400 text-xs text-center">يمكنك التصويت مرة واحدة فقط في هذا التحدي</p>
      </div>
    </div>
  )
}
