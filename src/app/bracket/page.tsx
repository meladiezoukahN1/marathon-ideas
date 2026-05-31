"use client"

import { useEffect, useMemo, useState } from "react"
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

type MatchVisualState = "active" | "finished" | "waiting"

function getMatchVisualState(match: BracketMatch): MatchVisualState {
  const isActive =
    match.phase === "PRESENTING" ||
    match.phase === "VOTING" ||
    match.phase === "RESULT"

  if (isActive) return "active"
  if (match.phase === "FINISHED") return "finished"
  return "waiting"
}

function getMatchStatusLabel(match: BracketMatch): string {
  const state = getMatchVisualState(match)

  if (state === "active") return "قيد التنفيذ"
  if (state === "finished") return "منتهي"

  return getChallengePhaseLabel(match.phase)
}

function PageBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.13),transparent_36%),linear-gradient(135deg,#fffdf7_0%,#eef8ff_48%,#f8fafc_100%)]" />
      <div className="absolute inset-0 bg-white/35" />
      <div className="absolute right-[-90px] top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute left-[-90px] bottom-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl sm:h-72 sm:w-72" />
    </>
  )
}

function LoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900" dir="rtl">
      <PageBackground />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/85 bg-white/88 px-6 py-8 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-10 sm:py-10">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-sky-200 border-t-sky-600" />
          <h1 className="text-2xl font-black text-sky-950 sm:text-3xl">
            جاري تحميل شجرة المنافسة...
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500 sm:text-base">
            يتم تجهيز بيانات التحديات والفرق
          </p>
        </div>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900" dir="rtl">
      <PageBackground />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/85 bg-white/88 px-6 py-8 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-10 sm:py-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl shadow-lg shadow-amber-100 sm:h-20 sm:w-20 sm:text-4xl">
            🏆
          </div>

          <h1 className="text-2xl font-black text-sky-950 sm:text-3xl">
            لا توجد تحديات حالياً
          </h1>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
            لم يتم إنشاء أي تحديات بعد. ستظهر شجرة المنافسة هنا عند توفر البيانات.
          </p>
        </div>
      </main>
    </div>
  )
}

function MatchBadge({ match }: { match: BracketMatch }) {
  const state = getMatchVisualState(match)

  const className =
    state === "active"
      ? "border-amber-300 bg-amber-400 text-slate-950 shadow-amber-100"
      : state === "finished"
        ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-100"
        : "border-sky-200 bg-sky-50 text-sky-800 shadow-sky-100"

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black shadow-md sm:px-4 sm:text-sm ${className}`}
    >
      {getMatchStatusLabel(match)}
    </span>
  )
}

function VSBadge({ active }: { active: boolean }) {
  return (
    <div
      className={`z-10 mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-xl font-black shadow-xl backdrop-blur-xl sm:h-16 sm:w-16 sm:text-2xl md:h-20 md:w-20 md:text-3xl ${
        active
          ? "border-amber-300 bg-amber-400 text-slate-950 shadow-amber-100"
          : "border-white/90 bg-white/90 text-sky-800 shadow-sky-100"
      }`}
    >
      VS
    </div>
  )
}

function TeamCard({
  team,
  score,
  isWinner,
  isFinished,
  tone,
}: {
  team: BracketMatch["team1"]
  score: number | null
  isWinner: boolean
  isFinished: boolean
  tone: "sky" | "emerald"
}) {
  const teamName = team?.name ?? "بانتظار الفريق"

  const scoreClass = tone === "sky" ? "text-sky-700" : "text-emerald-700"

  return (
    <div
      className={`min-w-0 rounded-[1.6rem] border p-4 text-center shadow-lg backdrop-blur-xl transition duration-300 sm:p-5 ${
        isWinner
          ? "border-amber-300 bg-amber-50/95 shadow-amber-100 ring-2 ring-amber-200"
          : "border-white/85 bg-white/88 shadow-sky-100/70"
      }`}
    >
      <div className="mx-auto w-fit rounded-2xl bg-white p-2 shadow-md ring-4 ring-sky-50">
        <TeamAvatar name={teamName} imageUrl={team?.imageUrl} size="md" />
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.7rem] text-base font-black leading-tight text-slate-900 sm:text-lg md:text-xl">
        {teamName}
      </h3>

      {isFinished && score != null && (
        <div
          className={`mx-auto mt-3 w-fit rounded-2xl bg-white px-4 py-2 text-2xl font-black leading-none shadow-md sm:text-3xl ${scoreClass}`}
        >
          {score}%
        </div>
      )}

      {isWinner && (
        <div className="mx-auto mt-3 w-fit rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-amber-100 sm:text-sm">
          الفائز
        </div>
      )}
    </div>
  )
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const state = getMatchVisualState(match)
  const isActive = state === "active"
  const isFinished = state === "finished"

  const t1Wins = Boolean(match.winnerId && match.winnerId === match.team1?.id)
  const t2Wins = Boolean(match.winnerId && match.winnerId === match.team2?.id)

  const wrapperClass =
    state === "active"
      ? "border-amber-300 bg-white/92 shadow-amber-100 ring-2 ring-amber-200"
      : state === "finished"
        ? "border-emerald-200 bg-white/90 shadow-emerald-100"
        : "border-white/85 bg-white/82 shadow-sky-100/70"

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border p-4 shadow-xl backdrop-blur-xl sm:p-5 md:p-6 ${wrapperClass}`}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-amber-300 via-amber-400 to-sky-400" />
      )}

      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-400 sm:text-sm">
            التحدي رقم {match.order}
          </p>
          <h2 className="mt-1 truncate text-lg font-black text-sky-950 sm:text-xl md:text-2xl">
            {match.name}
          </h2>
        </div>

        <MatchBadge match={match} />
      </header>

      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-5">
        <TeamCard
          team={match.team1}
          score={match.team1FinalScore}
          isWinner={t1Wins}
          isFinished={isFinished}
          tone="sky"
        />

        <VSBadge active={isActive} />

        <TeamCard
          team={match.team2}
          score={match.team2FinalScore}
          isWinner={t2Wins}
          isFinished={isFinished}
          tone="emerald"
        />
      </div>
    </article>
  )
}

function BracketSummary({ matches }: { matches: BracketMatch[] }) {
  const stats = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const state = getMatchVisualState(match)

        acc.total += 1
        if (state === "active") acc.active += 1
        if (state === "finished") acc.finished += 1
        if (state === "waiting") acc.waiting += 1

        return acc
      },
      {
        total: 0,
        active: 0,
        finished: 0,
        waiting: 0,
      },
    )
  }, [matches])

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-3xl border border-white/85 bg-white/86 p-4 text-center shadow-lg shadow-sky-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-sky-800 sm:text-3xl">
          {stats.total}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
          كل التحديات
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-center shadow-lg shadow-amber-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-amber-600 sm:text-3xl">
          {stats.active}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          قيد التنفيذ
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 text-center shadow-lg shadow-emerald-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-emerald-700 sm:text-3xl">
          {stats.finished}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          منتهية
        </div>
      </div>

      <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-4 text-center shadow-lg shadow-sky-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-sky-700 sm:text-3xl">
          {stats.waiting}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          بانتظار الدور
        </div>
      </div>
    </section>
  )
}

export default function BracketPage() {
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/public/bracket")
      .then((response) => response.json())
      .then((json) => {
        if (json.data) setMatches(json.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <LoadingState />
  }

  if (matches.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900" dir="rtl">
      <PageBackground />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-10">
        <header className="mb-6 rounded-[2rem] border border-white/85 bg-white/86 px-5 py-6 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-8 sm:py-8 md:mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-3xl shadow-lg shadow-amber-100 sm:h-16 sm:w-16 sm:text-4xl">
            🏆
          </div>

          <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl md:text-5xl">
            شجرة المنافسة
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500 sm:text-base md:text-lg">
            متابعة مباشرة لمسار التحديات، حالة كل مواجهة، والفريق المتأهل في كل مرحلة.
          </p>
        </header>

        <div className="mb-6 md:mb-8">
          <BracketSummary matches={matches} />
        </div>

        <section className="space-y-4 sm:space-y-5 md:space-y-6">
          {matches.map((match) => (
            <BracketMatchCard key={match.id} match={match} />
          ))}
        </section>
      </main>
    </div>
  )
}