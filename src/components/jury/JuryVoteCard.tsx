import React, { useState, useEffect } from "react"
import { TeamAvatar } from "@/components/common/team-avatar"
import type { ChallengePublic } from "@/types/domain.types"

function formatCountdown(seconds: number): string {
  const m = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")
  const s = String(Math.max(0, seconds) % 60).padStart(2, "0")
  return `${m}:${s}`
}

export function JuryVoteCard({
  challenge,
  onVoted,
}: {
  challenge: ChallengePublic
  onVoted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!challenge.votingEndsAt) return
    const iv = setInterval(() => {
      const remaining = Math.floor((new Date(challenge.votingEndsAt!).getTime() - Date.now()) / 1000)
      setCountdown(Math.max(0, remaining))
    }, 1000)
    return () => clearInterval(iv)
  }, [challenge.votingEndsAt])

  async function vote(teamId: string) {
    if (submitting) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/jury-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, teamId }),
      })
      const json = await res.json()
      if (json.data?.success || json.error === "ALREADY_VOTED") {
        onVoted()
      } else if (json.error === "VOTING_CLOSED") {
        setError("انتهى وقت التصويت")
      } else {
        setError(json.error === "VOTING_NOT_OPEN" ? "التصويت غير متاح" : "فشل التصويت")
      }
    } catch {
      setError("فشل الاتصال")
    }
    setSubmitting(false)
  }

  const isClosed = !!(countdown <= 0 && challenge.votingEndsAt)

  return (
    <div className="space-y-4">
      <p className="text-gray-700 font-bold text-center">{challenge.name}</p>
      {challenge.votingEndsAt && (
        <div className={`text-center text-sm font-mono font-bold ${countdown > 0 ? "text-emerald-600" : "text-red-500"}`}>
          ⏱️ {countdown > 0 ? formatCountdown(countdown) : "انتهى وقت التصويت"}
        </div>
      )}
      <div className="flex gap-3">
        {challenge.team1 && (
          <button
            onClick={() => vote(challenge.team1!.id)}
            disabled={submitting || isClosed}
            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 transition disabled:opacity-50"
          >
            <TeamAvatar name={challenge.team1.name} imageUrl={challenge.team1.imageUrl} size="lg" />
            <span>{challenge.team1.name}</span>
          </button>
        )}
        {challenge.team2 && (
          <button
            onClick={() => vote(challenge.team2!.id)}
            disabled={submitting || isClosed}
            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-semibold hover:bg-green-100 transition disabled:opacity-50"
          >
            <TeamAvatar name={challenge.team2.name} imageUrl={challenge.team2.imageUrl} size="lg" />
            <span>{challenge.team2.name}</span>
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  )
}
