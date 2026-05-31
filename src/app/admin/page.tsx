"use client"
export const dynamic = "force-dynamic"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { TimerControl } from "@/components/admin/TimerControl"
import { VotingTimerControl } from "@/components/admin/VotingTimerControl"
import { PhaseControl } from "@/components/admin/PhaseControl"
import { VoteMonitor } from "@/components/admin/VoteMonitor"
import { VoteAuditViewer } from "@/components/admin/VoteAuditViewer"
import { Badge } from "@/components/ui/Badge"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { getChallengePhaseLabel } from "@/lib/labels"
import type { ChallengePublic } from "@/types/domain.types"

async function timerPost(matchId: string, slot: "TEAM1" | "TEAM2", action: string, payload?: object) {
  const path = action === "patch"
    ? `/api/admin/matches/${matchId}/timers/${slot.toLowerCase()}`
    : `/api/admin/matches/${matchId}/timers/${slot.toLowerCase()}/${action}`
  const res = await fetch(path, {
    method: action === "patch" ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function activateMatch(matchId: string) {
  const res = await fetch(`/api/admin/matches/${matchId}/activate`, { method: "POST" })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function changePhase(matchId: string, phase: string, votingDurationSeconds?: number) {
  const res = await fetch(`/api/admin/matches/${matchId}/phase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase, votingDurationSeconds }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function calculateResult(matchId: string) {
  const res = await fetch(`/api/admin/matches/${matchId}/result`, { method: "POST" })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function getVoteCounts(matchId: string) {
  const res = await fetch(`/api/admin/matches/${matchId}/result`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data
}

async function resetMatchRequest(matchId: string) {
  const res = await fetch(`/api/admin/matches/${matchId}/reset`, { method: "POST" })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

async function votingTimerPost(matchId: string, action: string, payload?: object) {
  const path = action === "patch"
    ? `/api/admin/matches/${matchId}/voting-timer`
    : `/api/admin/matches/${matchId}/voting-timer/${action}`
  const res = await fetch(path, {
    method: action === "patch" ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export default function AdminDashboard() {
  const [challenges, setChallenges] = useState<ChallengePublic[]>([])
  const [activeId, setActiveId]     = useState<string>("")
  const [loading, setLoading]       = useState(true)
  const [acting, setActing]         = useState(false)
  const [voteCounts, setVoteCounts] = useState<{
    team1Public: number
    team2Public: number
    totalPublic: number
    team1Jury: number
    team2Jury: number
    totalJury: number
  } | null>(null)
  const [votingDuration, setVotingDuration] = useState(120)

  function load() {
    fetch(`/api/admin/matches`)
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setChallenges(j.data)
          setActiveId(p => p || j.data[0]?.id || "")
        }
      })
      .finally(() => setLoading(false))
  }

  async function loadVoteCounts(matchId: string) {
    try {
      const counts = await getVoteCounts(matchId)
      setVoteCounts(counts)
    } catch {
      setVoteCounts(null)
    }
  }

  useEffect(() => { load() }, [])

  const challenge = challenges.find(c => c.id === activeId)

  useEffect(() => {
    if (challenge?.id) {
      loadVoteCounts(challenge.id)
      const iv = setInterval(() => loadVoteCounts(challenge.id), 3000)
      return () => clearInterval(iv)
    }
  }, [challenge?.id])

  const handleTimerAction = useCallback(async (action: string, slot: "TEAM1" | "TEAM2", payload?: object) => {
    if (!challenge) return
    setActing(true)
    try {
      await timerPost(challenge.id, slot, action, payload)
      toast.success("تم تحديث المؤقت")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تعديل المؤقت")
    }
    setActing(false)
  }, [challenge])

  const handlePhase = useCallback(async (phase: string, votingDurationSeconds?: number) => {
    if (!challenge) return
    setActing(true)
    try {
      await changePhase(challenge.id, phase, votingDurationSeconds)
      setChallenges(p => p.map(c => c.id === challenge.id ? { ...c, phase: phase as ChallengePublic["phase"] } : c))
      toast.success("تم تغيير المرحلة")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تغيير المرحلة")
    }
    setActing(false)
  }, [challenge])

  const handleStartVoting = useCallback(async () => {
    if (!challenge) return
    setActing(true)
    try {
      if (challenge.phase === "WAITING") {
        await changePhase(challenge.id, "PRESENTING")
        setChallenges(p => p.map(c => c.id === challenge.id ? { ...c, phase: "PRESENTING" } : c))
      }
      await changePhase(challenge.id, "VOTING", votingDuration)
      setChallenges(p => p.map(c => c.id === challenge.id ? { ...c, phase: "VOTING" } : c))
      toast.success("تم بدء التصويت!")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل بدء التصويت")
    }
    setActing(false)
  }, [challenge, votingDuration])

  const handleCalculateResult = useCallback(async () => {
    if (!challenge) return
    setActing(true)
    try {
      const result = await calculateResult(challenge.id)
      // Do NOT change phase here — calculation ≠ reveal
      setChallenges(p => p.map(c => c.id === challenge.id ? {
        ...c,
        winnerId: result.winnerId,
        team1FinalScore: result.team1FinalScore,
        team2FinalScore: result.team2FinalScore,
        team1PublicPct: result.team1PublicPct,
        team2PublicPct: result.team2PublicPct,
        team1JuryPct: result.team1JuryPct,
        team2JuryPct: result.team2JuryPct,
      } : c))
      toast.success("تم حساب النتيجة!")
    } catch (e) {
      // Silently ignore auto-calculation errors (e.g. voting still open)
      if (e instanceof Error && e.message === "VOTING_STILL_OPEN") return
      toast.error(e instanceof Error ? e.message : "فشل حساب النتيجة")
    }
    setActing(false)
  }, [challenge])

  async function revealResult(matchId: string) {
    const res = await fetch(`/api/admin/matches/${matchId}/reveal`, { method: "POST" })
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    return json
  }

  const handleReveal = useCallback(async () => {
    if (!challenge) return
    if (!challenge.winnerId) {
      toast.error("يجب حساب النتيجة أولاً")
      return
    }
    setActing(true)
    try {
      await revealResult(challenge.id)
      setChallenges(p => p.map(c => c.id === challenge.id ? { ...c, phase: "RESULT" as ChallengePublic["phase"] } : c))
      toast.success("تم عرض النتيجة للجمهور!")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل عرض النتيجة")
    }
    setActing(false)
  }, [challenge])

  const currentlyActiveChallenge = challenges.find(c => c.phase === "PRESENTING" || c.phase === "VOTING" || c.phase === "RESULT")
  const isAnotherChallengeActive = !!currentlyActiveChallenge && currentlyActiveChallenge.id !== challenge?.id

  const handleActivate = useCallback(async () => {
    if (!challenge) return
    setActing(true)
    try {
      await activateMatch(challenge.id)
      toast.success("تم تعيين المباراة النشطة")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تعيين المباراة النشطة")
    }
    setActing(false)
  }, [challenge])

  const handleVotingTimerAction = useCallback(async (action: string, payload?: object) => {
    if (!challenge) return
    setActing(true)
    try {
      await votingTimerPost(challenge.id, action, payload)
      toast.success("تم تحديث مؤقت التصويت")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تعديل مؤقت التصويت")
    }
    setActing(false)
  }, [challenge])

  const handleReset = useCallback(async () => {
    if (!challenge) return
    if (!confirm("⚠️ هل أنت متأكد من إعادة ضبط النزال؟\n\nسيتم:\n• حذف جميع الأصوات\n• إعادة المؤقتات\n• مسح النتيجة والفائز\n• العودة لمرحلة الانتظار")) return
    setActing(true)
    try {
      await resetMatchRequest(challenge.id)
      setChallenges(p => p.map(c => c.id === challenge.id ? {
        ...c,
        phase: "WAITING",
        status: "PENDING",
        winnerId: null,
        team1FinalScore: null,
        team2FinalScore: null,
        team1PublicPct: null,
        team2PublicPct: null,
        team1JuryPct: null,
        team2JuryPct: null,
      } : c))
      toast.success("تم إعادة ضبط النزال")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل إعادة الضبط")
    }
    setActing(false)
  }, [challenge])

  // Live timer calculation (same logic as useLiveTimer hook)
  function getLiveTimerState(timer: ChallengePublic["team1Timer"]) {
    if (!timer) return { remainingSeconds: 0, status: "READY" as const, isFinished: true }
    if (timer.status !== "RUNNING" || !timer.startedAt) {
      return {
        remainingSeconds: Math.max(0, timer.remainingSeconds),
        status: timer.status,
        isFinished: timer.status === "FINISHED" || timer.remainingSeconds <= 0,
      }
    }
    const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
    const remaining = Math.max(0, timer.remainingSeconds - elapsed)
    const isFinished = remaining <= 0
    return {
      remainingSeconds: remaining,
      status: isFinished ? "FINISHED" : timer.status,
      isFinished,
    }
  }

  const t1Live = getLiveTimerState(challenge?.team1Timer)
  const t2Live = getLiveTimerState(challenge?.team2Timer)

  const team1Finished = t1Live.isFinished
  const team2Finished = t2Live.isFinished
  const bothTeamsFinished = team1Finished && team2Finished

  const canStartVoting =
    bothTeamsFinished &&
    (challenge?.phase === "PRESENTING" || challenge?.phase === "WAITING") &&
    !isAnotherChallengeActive

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">لوحة التحكم</h1>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">تحديث</button>
      </div>

      {/* Challenge tabs */}
      <div className="flex gap-2 flex-wrap">
        {challenges.map(c => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${c.id === activeId ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
            {c.order}. {c.name}
          </button>
        ))}
      </div>

      {loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>}

      {!loading && challenge && (
        <>
          {/* Active challenge banner */}
          {isAnotherChallengeActive && currentlyActiveChallenge && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm">
              ⚠️ تحدٍ آخر نشط حالياً: <strong>{currentlyActiveChallenge.name}</strong> ({getChallengePhaseLabel(currentlyActiveChallenge.phase)}).
              يجب إنهاء التحدي النشط أو إعادة ضبطه قبل البدء بهذا التحدي.
            </div>
          )}

          {/* Status strip */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <p className="text-xs text-gray-500">التحدي الحالي</p>
                <p className="font-bold text-gray-900">{challenge.name}</p>
              </div>
              <Badge label={getChallengePhaseLabel(challenge.phase)} variant={{ WAITING:"neutral",PRESENTING:"info",VOTING:"success",RESULT:"warning",FINISHED:"neutral" }[challenge.phase] as "neutral"} size="md" />
              {challenge.team1 && <span className="text-sm text-gray-600">🔵 {challenge.team1.name}</span>}
              {challenge.team2 && <span className="text-sm text-gray-600">🟢 {challenge.team2.name}</span>}
              {challenge.status === "ACTIVE" && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">نشط</span>
              )}
            </div>
          </div>

          {/* Voting readiness banner — shows when both teams finished presenting */}
          {(challenge.phase === "PRESENTING" || challenge.phase === "WAITING") && (
            <div className={`rounded-2xl border p-5 ${bothTeamsFinished ? "bg-emerald-50 border-emerald-300" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    المرحلة الحالية: <strong className="text-gray-900">{getChallengePhaseLabel(challenge.phase)}</strong>
                  </p>
                  {bothTeamsFinished ? (
                    <p className="text-emerald-800 font-bold text-lg">✅ الفريقان أنهيا العرض</p>
                  ) : (
                    <p className="text-blue-800 font-semibold">⏳ في انتظار انتهاء عرض الفريقين...</p>
                  )}
                </div>

                {canStartVoting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-300 shadow-sm">
                      <label className="text-sm text-emerald-800 font-bold whitespace-nowrap">مدة التصويت بالثواني:</label>
                      <input
                        type="number"
                        min={10}
                        max={3600}
                        value={votingDuration}
                        onChange={e => setVotingDuration(Math.max(10, parseInt(e.target.value) || 120))}
                        className="w-20 px-2 py-1 rounded border border-emerald-300 text-center text-sm font-bold"
                      />
                    </div>
                    <button
                      onClick={handleStartVoting}
                      disabled={acting}
                      className="px-10 py-4 rounded-xl bg-emerald-600 text-white text-xl font-black disabled:opacity-50 hover:bg-emerald-700 transition shadow-2xl"
                    >
                      🗳️ بدء التصويت
                    </button>
                  </div>
                ) : bothTeamsFinished ? (
                  <div className="px-6 py-3 rounded-xl bg-yellow-100 text-yellow-800 text-sm font-bold">
                    ⚠️ يوجد تحدٍ آخر نشط. يجب إنهاؤه أولاً.
                  </div>
                ) : null}
              </div>

              {!bothTeamsFinished && (
                <div className="mt-3 pt-3 border-t border-blue-200/50 text-blue-700 text-sm">
                  <p>لبدء التصويت، يجب إنهاء عرض الفريقين أولاً. استخدم أزرار المؤقت في الأسفل.</p>
                  <div className="flex gap-6 mt-2 text-xs">
                    <span className={team1Finished ? "text-emerald-600 font-bold" : "text-gray-500"}>
                      {team1Finished ? "✓" : "○"} الفريق 1: {team1Finished ? "انتهى" : "قيد العرض"}
                    </span>
                    <span className={team2Finished ? "text-emerald-600 font-bold" : "text-gray-500"}>
                      {team2Finished ? "✓" : "○"} الفريق 2: {team2Finished ? "انتهى" : "قيد العرض"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAnotherChallengeActive && challenge.phase === "WAITING" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-600 text-sm">
              ⏸️ هذا التحدي في الانتظار. لا يمكن تفعيله حتى ينتهي التحدي النشط.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleActivate}
              disabled={acting || isAnotherChallengeActive || challenge.phase === "FINISHED" || challenge.phase === "RESULT"}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
            >
              تعيين كمباراة نشطة
            </button>
            <button
              onClick={handleReset}
              disabled={acting || challenge.phase === "WAITING"}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition"
            >
              إعادة ضبط النزال
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimerControl challenge={challenge} onTimerAction={handleTimerAction} isLoading={acting} />
            <PhaseControl
              challenge={challenge}
              onPhase={handlePhase}
              onReveal={handleReveal}
              onCalculateResult={handleCalculateResult}
              isLoading={acting}
            />
          </div>

          {(challenge.phase === "VOTING" || challenge.phase === "FINISHED" || challenge.phase === "RESULT") && (
            <div className={challenge.phase === "VOTING" ? "md:w-1/2" : ""}>
              <VotingTimerControl
                votingTimerStatus={challenge.votingTimerStatus}
                votingEndsAt={challenge.votingEndsAt}
                votingTimerPausedAt={challenge.votingTimerPausedAt}
                votingDurationSeconds={challenge.votingDurationSeconds}
                onPause={() => handleVotingTimerAction("pause")}
                onResume={() => handleVotingTimerAction("resume")}
                onReset={() => handleVotingTimerAction("reset")}
                onAdd={(s) => handleVotingTimerAction("patch", { deltaSeconds: s })}
                onSubtract={(s) => handleVotingTimerAction("patch", { deltaSeconds: -s })}
                onSet={(s) => handleVotingTimerAction("patch", { remainingSeconds: s })}
                disabled={acting}
              />
            </div>
          )}

          <VoteMonitor challenge={challenge} counts={voteCounts} />

          {(challenge.phase === "VOTING" || challenge.phase === "RESULT" || challenge.phase === "FINISHED") && (
            <VoteAuditViewer challenge={challenge} />
          )}

          {/* Dangerous actions */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-red-800">إجراءات خطيرة</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleReset}
                disabled={acting || challenge.phase === "WAITING"}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition"
              >
                إعادة ضبط هذا النزال بالكامل
              </button>
              <a
                href="/admin/challenges"
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition inline-flex items-center"
              >
                إعادة ضبط كل التحديات
              </a>
              <a
                href="/admin/challenges"
                className="px-4 py-2 rounded-xl bg-red-800 text-white text-sm font-semibold hover:bg-red-900 transition inline-flex items-center"
              >
                حذف كل التحديات نهائياً
              </a>
            </div>
          </div>
        </>
      )}

      {!loading && !challenge && (
        <div className="text-center py-20 text-gray-400">
          <p>لا توجد تحديات. ابدأ بإنشاء تحديات من صفحة <a href="/admin/challenges" className="text-blue-600 underline">التحديات</a></p>
        </div>
      )}
    </div>
  )
}
