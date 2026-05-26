"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import type { PublicActiveMatch } from "@/server/modules/matches/types"
import type { TimerState } from "@/types/domain.types"
import { TeamAvatar } from "@/components/common/team-avatar"
import { getTimerStatusLabel } from "@/lib/labels"

function formatCountdown(seconds: number): string {
  const m = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")
  const s = String(Math.max(0, seconds) % 60).padStart(2, "0")
  return `${m}:${s}`
}

function formatTime(seconds: number): string {
  const m = String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")
  const s = String(Math.max(0, seconds) % 60).padStart(2, "0")
  return `${m}:${s}`
}

// ─── Live timer hook with smooth second-by-second decrement ──────────────────
function useLiveTimer(backendTimer: TimerState): { live: number; status: string } {
  const [live, setLive] = useState(backendTimer.remainingSeconds)
  const syncRef = useRef({ base: backendTimer.remainingSeconds, syncedAt: Date.now(), status: backendTimer.status })

  // Re-sync when backend data changes
  useEffect(() => {
    syncRef.current = { base: backendTimer.remainingSeconds, syncedAt: Date.now(), status: backendTimer.status }
    setLive(backendTimer.remainingSeconds)
  }, [backendTimer.remainingSeconds, backendTimer.status, backendTimer.startedAt])

  // Tick down every second while RUNNING
  useEffect(() => {
    if (backendTimer.status !== "RUNNING") return
    const iv = setInterval(() => {
      const s = syncRef.current
      const elapsed = Math.floor((Date.now() - s.syncedAt) / 1000)
      setLive(Math.max(0, s.base - elapsed))
    }, 200)
    return () => clearInterval(iv)
  }, [backendTimer.status])

  const status = backendTimer.status === "RUNNING" && live <= 0 ? "FINISHED" : backendTimer.status

  return { live, status }
}

function TimerDisplay({ timer, label, imageUrl }: { timer: TimerState; label: string; imageUrl?: string | null }) {
  const { live, status } = useLiveTimer(timer)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl md:text-7xl font-mono font-bold ${
        live <= 0 ? "text-red-500" : status === "RUNNING" ? "text-green-400" : "text-gray-300"
      }`}>
        {formatTime(live)}
      </div>
      <TeamAvatar name={label} imageUrl={imageUrl} size="xl" />
      <div className="text-lg md:text-xl font-bold text-center">{label}</div>
      <div className="text-sm text-gray-400">{getTimerStatusLabel(status)}</div>
    </div>
  )
}

function VSPhase({ match }: { match: PublicActiveMatch }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-8">
      <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-6xl">
        <TimerDisplay timer={match.team1Timer} label={match.team1?.name ?? "الفريق 1"} imageUrl={match.team1?.imageUrl} />
        <div className="flex-shrink-0">
          <div className="text-4xl md:text-6xl font-black text-gray-500">VS</div>
        </div>
        <TimerDisplay timer={match.team2Timer} label={match.team2?.name ?? "الفريق 2"} imageUrl={match.team2?.imageUrl} />
      </div>
    </div>
  )
}

function VotingPhase({ match }: { match: PublicActiveMatch }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : ""
  const voteUrl = `${appUrl}/vote`
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (!match.votingEndsAt) return
    const iv = setInterval(() => {
      const remaining = Math.floor((new Date(match.votingEndsAt!).getTime() - Date.now()) / 1000)
      setCountdown(Math.max(0, remaining))
    }, 1000)
    return () => clearInterval(iv)
  }, [match.votingEndsAt])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
      <h2 className="text-3xl md:text-5xl font-black text-emerald-400">التصويت مفتوح 🗳️</h2>
      {match.votingEndsAt && (
        <div className={`text-5xl md:text-7xl font-mono font-bold ${countdown > 0 ? "text-yellow-400" : "text-red-500"}`}>
          {formatCountdown(countdown)}
        </div>
      )}
      <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-4xl">
        <div className="flex-1 flex flex-col items-center gap-4">
          <TeamAvatar name={match.team1?.name ?? "الفريق 1"} imageUrl={match.team1?.imageUrl} size="xl" />
          <div className="text-xl md:text-2xl font-bold text-center">{match.team1?.name ?? "الفريق 1"}</div>
        </div>
        <div className="flex-shrink-0">
          <div className="text-4xl md:text-6xl font-black text-gray-500">VS</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-4">
          <TeamAvatar name={match.team2?.name ?? "الفريق 2"} imageUrl={match.team2?.imageUrl} size="xl" />
          <div className="text-xl md:text-2xl font-bold text-center">{match.team2?.name ?? "الفريق 2"}</div>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-gray-400">امسح QR للتصويت</p>
        <div className="bg-white p-4 rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(voteUrl)}`}
            alt="QR"
            className="w-32 h-32 md:w-40 md:h-40"
          />
        </div>
        <p className="text-sm text-gray-500">{voteUrl}</p>
      </div>
    </div>
  )
}

function ResultPhase({ match }: { match: PublicActiveMatch }) {
  const t1Score = (match as unknown as Record<string, number | null>).team1FinalScore ?? 0
  const t2Score = (match as unknown as Record<string, number | null>).team2FinalScore ?? 0
  const winnerId = match.winnerId
  const t1IsWinner = winnerId === match.team1?.id
  const t2IsWinner = winnerId === match.team2?.id

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
      <h2 className="text-3xl md:text-5xl font-black text-yellow-400">🏆 النتيجة النهائية</h2>
      <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-4xl">
        <div className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-2xl ${t1IsWinner ? "bg-yellow-500/20 border-2 border-yellow-500" : "opacity-60"}`}>
          <TeamAvatar name={match.team1?.name ?? "الفريق 1"} imageUrl={match.team1?.imageUrl} size="xl" />
          <div className="text-xl md:text-2xl font-bold text-center">{match.team1?.name ?? "الفريق 1"}</div>
          <div className="text-4xl md:text-5xl font-black text-blue-400">{t1Score}%</div>
          {t1IsWinner && <div className="text-yellow-400 text-2xl">🏆 الفائز</div>}
        </div>
        <div className="flex-shrink-0">
          <div className="text-4xl md:text-6xl font-black text-gray-500">VS</div>
        </div>
        <div className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-2xl ${t2IsWinner ? "bg-yellow-500/20 border-2 border-yellow-500" : "opacity-60"}`}>
          <TeamAvatar name={match.team2?.name ?? "الفريق 2"} imageUrl={match.team2?.imageUrl} size="xl" />
          <div className="text-xl md:text-2xl font-bold text-center">{match.team2?.name ?? "الفريق 2"}</div>
          <div className="text-4xl md:text-5xl font-black text-green-400">{t2Score}%</div>
          {t2IsWinner && <div className="text-yellow-400 text-2xl">🏆 الفائز</div>}
        </div>
      </div>
    </div>
  )
}

export default function DisplayPage() {
  const [match, setMatch] = useState<PublicActiveMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch("/api/public/active-match")
      const json = await res.json()
      if (json.error) {
        if (json.error === "NO_ACTIVE_MATCH") {
          setMatch(null)
          setError(null)
        } else {
          setError(json.error)
        }
      } else {
        setMatch(json.data)
        setError(null)
      }
    } catch {
      setError("SERVER_ERROR")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatch()
    intervalRef.current = setInterval(fetchMatch, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchMatch])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-2xl font-bold text-red-500">خطأ: {error}</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
        <div className="text-2xl font-bold text-gray-400">لا توجد مباراة نشطة</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden" dir="rtl">
      <header className="flex items-center justify-between px-6 py-6 border-b border-gray-800">
        <h1 className="text-3xl font-black">{match.name}</h1>
        <a href="/bracket" className="text-sm text-gray-400 hover:text-white transition">شجرة المنافسة →</a>
      </header>

      {match.phase === "PRESENTING" && <VSPhase match={match} />}
      {match.phase === "VOTING" && <VotingPhase match={match} />}
      {(match.phase === "RESULT" || match.phase === "FINISHED") && <ResultPhase match={match} />}
      {match.phase === "WAITING" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl font-bold text-gray-400">في انتظار بدء التحدي...</div>
        </div>
      )}
    </div>
  )
}
