"use client"
import { useEffect, useState } from "react"
import { generateVoterToken, hasVotedLocally, markVotedLocally } from "@/lib/fingerprint"
import { TeamAvatar } from "@/components/common/team-avatar"
import { getChallengePhaseLabel } from "@/lib/labels"

interface ActiveChallenge {
  id: string
  title: string
  phase: string
  votingEndsAt: string | null
  votingSessionId: string | null
  team1: { id: string; name: string; imageUrl: string | null } | null
  team2: { id: string; name: string; imageUrl: string | null } | null
}

export default function VotePage() {
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const token = typeof window !== "undefined" ? generateVoterToken() : "tok"

  useEffect(() => {
    fetch("/api/public/active-challenge")
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setChallenge(j.data)
          if (hasVotedLocally(j.data.id, j.data.votingSessionId)) {
            setAlreadyVoted(true)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!challenge?.votingEndsAt) return
    const iv = setInterval(() => {
      const remaining = Math.floor((new Date(challenge.votingEndsAt!).getTime() - Date.now()) / 1000)
      setCountdown(Math.max(0, remaining))
    }, 1000)
    return () => clearInterval(iv)
  }, [challenge?.votingEndsAt])

  async function submitVote() {
    if (!selected || !challenge) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, teamId: selected, voterToken: token }),
      })
      const json = await res.json()
      if (json.data?.success) {
        markVotedLocally(challenge.id, challenge.votingSessionId)
        setVoted(true)
      } else if (json.error === "ALREADY_VOTED") {
        markVotedLocally(challenge.id, challenge.votingSessionId)
        setAlreadyVoted(true)
      } else if (json.error === "VOTING_CLOSED") {
        setError("انتهى وقت التصويت")
      } else {
        setError(json.error === "VOTING_NOT_OPEN" ? "التصويت غير متاح" : "حدث خطأ، حاول مجدداً")
      }
    } catch {
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

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">📭</div>
        <div className="text-xl font-bold text-gray-700">لا يوجد تحدٍ نشط حاليا</div>
        <p className="text-gray-500 text-center max-w-xs">لم يتم تحديد تحدٍ نشط. يرجى الانتظار حتى يبدأ المسؤول التحدي.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض شجرة المنافسة</a>
      </div>
    )
  }

  if (challenge.phase === "WAITING") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">⏳</div>
        <div className="text-xl font-bold text-gray-700">{challenge.title}</div>
        <p className="text-gray-500">التحدي في مرحلة الانتظار. لم يبدأ العرض بعد.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض شجرة المنافسة</a>
      </div>
    )
  }

  if (challenge.phase === "PRESENTING") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">🎤</div>
        <div className="text-xl font-bold text-gray-700">{challenge.title}</div>
        <p className="text-gray-500">جاري عرض الفرق. سيتم فتح التصويت بعد انتهاء العرض.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض شجرة المنافسة</a>
      </div>
    )
  }

  if (challenge.phase === "RESULT" || challenge.phase === "FINISHED") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">🏆</div>
        <div className="text-xl font-bold text-gray-700">{challenge.title}</div>
        <p className="text-gray-500">انتهى التصويت وتم الإعلان عن النتيجة.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض النتائج الكاملة</a>
      </div>
    )
  }

  if (challenge.phase !== "VOTING") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">🔒</div>
        <div className="text-xl font-bold text-gray-700">التصويت غير متاح حاليا</div>
        <p className="text-gray-500">التحدي في مرحلة {getChallengePhaseLabel(challenge.phase)}.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض النتائج الكاملة</a>
      </div>
    )
  }

  if (countdown <= 0 && challenge.votingEndsAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">⏱️</div>
        <div className="text-xl font-bold text-gray-700">{challenge.title}</div>
        <p className="text-red-500 font-bold">انتهى وقت التصويت</p>
        <p className="text-gray-500">لم يعد بإمكانك التصويت في هذا التحدي.</p>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض النتائج الكاملة</a>
      </div>
    )
  }

  if (voted || alreadyVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">✅</div>
        <div className="text-xl font-bold text-gray-800">{alreadyVoted ? "لقد قمت بالتصويت سابقا" : "تم تسجيل تصويتك بنجاح"}</div>
        <a href="/bracket" className="text-blue-600 underline text-lg">عرض النتائج الكاملة</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🗳️</div>
          <h1 className="text-xl font-black text-gray-900">{challenge.title}</h1>
          <p className="text-gray-500 text-sm mt-1">اختر الفريق الذي تريد التصويت له</p>
          {countdown > 0 && (
            <div className="mt-2 text-sm font-mono text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full">
              ⏱️ الوقت المتبقي: {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
            </div>
          )}
          {countdown <= 0 && challenge.votingEndsAt && (
            <div className="mt-2 text-sm font-mono text-red-600 bg-red-50 inline-block px-3 py-1 rounded-full">
              ⏱️ انتهى وقت التصويت
            </div>
          )}
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
                ${selected === t.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}>
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

        <p className="text-gray-400 text-xs text-center">يمكنك التصويت مرة واحدة فقط</p>
      </div>
    </div>
  )
}
