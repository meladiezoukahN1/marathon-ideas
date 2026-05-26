"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { JuryVoteCard } from "@/components/jury/JuryVoteCard"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { Badge } from "@/components/ui/Badge"
import type { ChallengePublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export default function JuryPage() {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<ChallengePublic[]>([])
  const [votedIds, setVotedIds]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)

  function load() {
    fetch(`/api/challenges?eventId=${EVENT_ID}`)
      .then(r => r.json())
      .then(j => { if (j.data) setChallenges(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [])

  const active  = challenges.filter(c => c.phase === "VOTING" && !votedIds.has(c.id))
  const waiting = challenges.filter(c => c.phase !== "VOTING" && !votedIds.has(c.id))
  const done    = challenges.filter(c => votedIds.has(c.id))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">⚖️</div>
          <h1 className="text-2xl font-black text-gray-900">لجنة التحكيم</h1>
          {session?.user && (
            <p className="text-gray-500 text-sm mt-1">مرحباً، {session.user.name}</p>
          )}
        </div>

        {loading && <CardSkeleton />}

        {/* Active voting */}
        {active.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border-2 border-emerald-400 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge label="مفتوح للتصويت" variant="success" size="md" />
            </div>
            <JuryVoteCard challenge={c} onVoted={() => setVotedIds(p => new Set([...p, c.id]))} />
          </div>
        ))}

        {/* Waiting */}
        {waiting.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-700">{c.name}</p>
                <p className="text-gray-500 text-sm mt-0.5">في انتظار فتح التصويت</p>
              </div>
              <Badge label="انتظار" variant="neutral" />
            </div>
          </div>
        ))}

        {/* Done */}
        {done.map(c => (
          <div key={c.id} className="bg-emerald-50 rounded-2xl border border-emerald-200 px-5 py-4 flex items-center gap-3">
            <span className="text-emerald-500 text-xl">✓</span>
            <div>
              <p className="font-medium text-emerald-800">{c.name}</p>
              <p className="text-emerald-600 text-xs">تم التصويت</p>
            </div>
          </div>
        ))}

        {!loading && challenges.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>لا توجد تحديات بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
