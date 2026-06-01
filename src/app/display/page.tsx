"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PublicActiveMatch } from "@/server/modules/matches/types"
import type { TimerState } from "@/types/domain.types"
import type { TimerSnapshot } from "@/lib/timer-snapshot"
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


const pageShellClass =
  "relative min-h-screen overflow-hidden text-slate-900 flex flex-col"

const backgroundLayer = (
  <>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,#fffdf7_0%,#eef8ff_50%,#f8fafc_100%)]" />
    <div className="absolute inset-0 bg-white/35" />
    <div className="absolute right-[-80px] top-24 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl sm:h-72 sm:w-72" />
    <div className="absolute left-[-80px] bottom-12 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl sm:h-72 sm:w-72" />
  </>
)

type PresentingTeam = {
  slot: "TEAM1" | "TEAM2"
  name: string
  imageUrl?: string | null
  timer: TimerState
  snapshot: TimerSnapshot
}

type PresentationViewMode =
  | "BOTH_BEFORE_START"
  | "TEAM1_PRESENTING"
  | "BOTH_BEFORE_TEAM2"
  | "TEAM2_PRESENTING"
  | "BOTH_AFTER_PRESENTATIONS"

function StatusScreen({
  title,
  tone = "neutral",
}: {
  title: string
  tone?: "neutral" | "error"
}) {
  return (
    <div className={pageShellClass} dir="rtl">
      {backgroundLayer}

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/85 bg-white/88 px-6 py-7 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-10 sm:py-9">
          <div
            className={`text-2xl font-black leading-tight sm:text-3xl md:text-4xl ${
              tone === "error" ? "text-rose-600" : "text-sky-900"
            }`}
          >
            {title}
          </div>
        </div>
      </main>
    </div>
  )
}

function isTimerActive(snap: TimerSnapshot): boolean {
  return snap.status === "RUNNING" || snap.status === "PAUSED" || snap.status === "SCHEDULED"
}

function isTimerEnded(snap: TimerSnapshot): boolean {
  return snap.status === "ENDED"
}

function getPresentationViewMode(match: PublicActiveMatch): PresentationViewMode {
  const active = match.activePresentationTeam

  if (active === "TEAM1") return "TEAM1_PRESENTING"
  if (active === "TEAM2") return "TEAM2_PRESENTING"

  const t1Active = isTimerActive(match.team1TimerSnapshot)
  const t2Active = isTimerActive(match.team2TimerSnapshot)
  const t1Ended = isTimerEnded(match.team1TimerSnapshot)
  const t2Ended = isTimerEnded(match.team2TimerSnapshot)

  if (active === "VOTING" || active === "RESULT" || active === "WAITING") {
    if (t1Ended && t2Ended) return "BOTH_AFTER_PRESENTATIONS"
    if (t1Ended && !t2Ended) return "BOTH_BEFORE_TEAM2"
    return "BOTH_BEFORE_START"
  }

  if (t1Active) return "TEAM1_PRESENTING"
  if (t2Active) return "TEAM2_PRESENTING"

  if (t1Ended && t2Ended) return "BOTH_AFTER_PRESENTATIONS"
  if (t1Ended && !t2Ended) return "BOTH_BEFORE_TEAM2"

  return "BOTH_BEFORE_START"
}

function getPresentingTeam(match: PublicActiveMatch): PresentingTeam | null {
  const mode = getPresentationViewMode(match)

  if (mode === "TEAM1_PRESENTING") {
    return {
      slot: "TEAM1",
      name: match.team1?.name ?? "الفريق الأول",
      imageUrl: match.team1?.imageUrl,
      timer: match.team1Timer,
      snapshot: match.team1TimerSnapshot,
    }
  }

  if (mode === "TEAM2_PRESENTING") {
    return {
      slot: "TEAM2",
      name: match.team2?.name ?? "الفريق الثاني",
      imageUrl: match.team2?.imageUrl,
      timer: match.team2Timer,
      snapshot: match.team2TimerSnapshot,
    }
  }

  return null
}

function VSBadge() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/90 bg-white/90 text-2xl font-black text-sky-800 shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:h-20 sm:w-20 sm:text-3xl md:h-24 md:w-24 md:text-4xl">
      VS
    </div>
  )
}

function TeamIntroCard({
  label,
  imageUrl,
  status,
  align = "center",
}: {
  label: string
  imageUrl?: string | null
  status?: string
  align?: "right" | "left" | "center"
}) {
  const alignmentClass =
    align === "right"
      ? "justify-self-end"
      : align === "left"
        ? "justify-self-start"
        : "justify-self-center"

  return (
    <section
      className={`w-[82%] max-w-[19rem] rounded-[1.7rem] border border-white/85 bg-white/88 p-4 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:w-full sm:max-w-sm sm:p-5 md:max-w-md md:p-6 ${alignmentClass}`}
    >
      <div className="mx-auto w-fit rounded-[1.5rem] bg-amber-100/80 p-3 shadow-lg ring-2 ring-amber-300/50 sm:p-4">
        <div className="rounded-full bg-white p-1.5 shadow-md ring-4 ring-white/80 sm:p-2">
          <TeamAvatar name={label} imageUrl={imageUrl} size="xl" />
        </div>
      </div>

      <h2 className="mt-4 line-clamp-2 text-xl font-black leading-tight text-slate-900 sm:text-2xl md:text-3xl">
        {label}
      </h2>

      {status && (
        <div className="mx-auto mt-3 w-fit rounded-full bg-sky-50 px-4 py-1.5 text-xs font-black text-sky-800 shadow-sm sm:text-sm">
          {status}
        </div>
      )}
    </section>
  )
}

function TeamsTogetherView({
  match,
  title,
  description,
}: {
  match: PublicActiveMatch
  title: string
  description: string
}) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-5 sm:gap-7 sm:px-6 sm:py-7 md:gap-9 md:py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-white/85 bg-white/88 px-6 py-5 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-8 sm:py-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-3xl shadow-lg shadow-amber-100 sm:h-16 sm:w-16">
          ⚔️
        </div>

        <h2 className="text-2xl font-black leading-tight text-sky-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
          {description}
        </p>
      </section>

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-4 sm:gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <TeamIntroCard
          label={match.team1?.name ?? "الفريق الأول"}
          imageUrl={match.team1?.imageUrl}
          status={getTimerStatusLabel(match.team1Timer.status)}
          align="right"
        />

        <VSBadge />

        <TeamIntroCard
          label={match.team2?.name ?? "الفريق الثاني"}
          imageUrl={match.team2?.imageUrl}
          status={getTimerStatusLabel(match.team2Timer.status)}
          align="left"
        />
      </div>
    </main>
  )
}

function ScheduleCountdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime()
  const calc = useCallback(
    () => Math.max(0, Math.ceil((target - Date.now()) / 1000)),
    [target],
  )
  const [remaining, setRemaining] = useState(calc)

  useEffect(() => {
    setRemaining(calc())
    const iv = setInterval(() => setRemaining(calc()), 1000)
    return () => clearInterval(iv)
  }, [target, calc])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-4xl sm:text-5xl md:text-6xl font-black text-amber-600">
        {remaining}
      </div>
      <div className="text-xl sm:text-2xl font-black text-amber-700">
        يبدأ خلال
      </div>
    </div>
  )
}

function PresentingTeamCard({ team }: { team: PresentingTeam }) {
  const snap = team.snapshot
  const remaining = snap.remainingSeconds
  const status = snap.status

  const timerClass =
    status === "ENDED" || remaining <= 0
      ? "border-rose-200 bg-rose-50 text-rose-600 shadow-rose-100"
      : status === "RUNNING"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100 ring-2 ring-emerald-200"
        : status === "SCHEDULED"
          ? "border-amber-200 bg-amber-50 text-amber-600 shadow-amber-100 ring-2 ring-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100 ring-2 ring-amber-200"

  const slotLabel = team.slot === "TEAM1" ? "الفريق الأول" : "الفريق الثاني"

  console.log("[DISPLAY_TIMER_RENDER_VALUE]", JSON.stringify({
    team: team.slot,
    displayedRemaining: remaining,
    displayedStatus: status,
    snapshotRemainingSeconds: snap.remainingSeconds,
    snapshotStatus: snap.status,
    snapshotDurationSeconds: snap.durationSeconds,
    snapshotStartedAt: snap.startedAt,
    snapshotServerNow: snap.serverNow,
    derived: "from snap.remainingSeconds directly",
  }))

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-7 md:py-10">
      <section className="mx-auto w-full max-w-4xl rounded-[2.4rem] border border-white/85 bg-white/90 p-5 text-center shadow-2xl shadow-sky-100/80 backdrop-blur-xl sm:p-7 md:p-9 lg:p-10">
        <div className="mx-auto mb-5 w-fit rounded-full border border-sky-200 bg-sky-50 px-5 py-2 text-sm font-black text-sky-900 shadow-sm sm:text-base">
          يعرض الآن: {slotLabel}
        </div>

        {status === "SCHEDULED" && snap.startsAt ? (
          <ScheduleCountdown startsAt={snap.startsAt} />
        ) : status === "PAUSED" ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black text-amber-600">
              {formatTime(remaining)}
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700">
              متوقف
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto w-fit rounded-[2rem] border px-7 py-4 font-mono text-6xl font-black leading-none shadow-xl sm:px-9 sm:py-5 sm:text-7xl md:text-8xl lg:text-9xl ${timerClass}`}
          >
            {formatTime(remaining)}
          </div>
        )}

        <div className="mx-auto mt-7 w-fit rounded-[2rem] bg-amber-100/80 p-4 shadow-xl ring-2 ring-amber-300/50 sm:p-5 md:p-6">
          <div className="rounded-full bg-white p-2 shadow-lg ring-4 ring-white/90 sm:p-3">
            <TeamAvatar name={team.name} imageUrl={team.imageUrl} size="xl" />
          </div>
        </div>

        <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-6xl">
          {team.name}
        </h2>

        {status !== "SCHEDULED" && (
          <div className="mx-auto mt-5 w-fit rounded-full bg-slate-900 px-5 py-2 text-sm font-black text-white shadow-lg sm:px-6 sm:text-base">
            {getTimerStatusLabel(status)}
          </div>
        )}
      </section>
    </main>
  )
}

function PresentationPhase({ match }: { match: PublicActiveMatch }) {
  const mode = getPresentationViewMode(match)
  const presentingTeam = getPresentingTeam(match)

  if (presentingTeam) {
    return <PresentingTeamCard team={presentingTeam} />
  }

  if (mode === "BOTH_BEFORE_TEAM2") {
    return (
      <TeamsTogetherView
        match={match}
        title="انتهى عرض الفريق الأول"
        description="يتم الآن تجهيز عرض الفريق الثاني. عند تشغيل المؤقت سيظهر الفريق الثاني وحده على الشاشة."
      />
    )
  }

  if (mode === "BOTH_AFTER_PRESENTATIONS") {
    return (
      <TeamsTogetherView
        match={match}
        title="انتهى عرض الفريقين"
        description="لن يتم عرض النتيجة تلقائيًا. ستظهر النتيجة فقط عند اختيار عرض النتيجة من لوحة التحكم."
      />
    )
  }

  return (
    <TeamsTogetherView
      match={match}
      title="استعداد التحدي"
      description="سيتم عرض كل فريق وحده عند تشغيل مؤقت العرض الخاص به."
    />
  )
}

function VotingPhase({ match }: { match: PublicActiveMatch }) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : ""
  const voteUrl = `${appUrl}/vote`
  const snap = match.votingTimerSnapshot
  const countdown = snap.remainingSeconds
  const status = snap.status

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 md:gap-8 md:py-10">
      <section className="rounded-[1.7rem] border border-white/85 bg-white/88 px-6 py-4 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-8 sm:py-5">
        <h2 className="text-3xl font-black leading-tight text-emerald-700 sm:text-4xl md:text-5xl">
          التصويت مفتوح
        </h2>
      </section>

      <div
        className={`rounded-[1.7rem] border px-7 py-4 font-mono text-5xl font-black leading-none shadow-xl sm:text-6xl md:text-7xl ${
          countdown > 0
            ? "border-amber-200 bg-amber-50 text-amber-600 shadow-amber-100 ring-2 ring-amber-200"
            : "border-rose-200 bg-rose-50 text-rose-600 shadow-rose-100"
        }`}
      >
        {status === "PAUSED" ? (
          <div className="flex flex-col items-center gap-1">
            <span>{formatCountdown(countdown)}</span>
            <span className="text-base sm:text-lg font-black text-amber-700">متوقف</span>
          </div>
        ) : (
          formatCountdown(countdown)
        )}
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-4 sm:gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <TeamIntroCard
          label={match.team1?.name ?? "الفريق الأول"}
          imageUrl={match.team1?.imageUrl}
          align="right"
        />

        <VSBadge />

        <TeamIntroCard
          label={match.team2?.name ?? "الفريق الثاني"}
          imageUrl={match.team2?.imageUrl}
          align="left"
        />
      </div>

      <section className="w-full max-w-sm rounded-[1.7rem] border border-white/85 bg-white/92 p-5 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:p-6">
        <p className="mb-4 text-base font-black text-sky-900 sm:text-lg">
          امسح الرمز للتصويت
        </p>

        <div className="mx-auto w-fit rounded-3xl bg-white p-3 shadow-lg ring-1 ring-sky-100 sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              voteUrl,
            )}`}
            alt="رمز التصويت"
            className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44"
          />
        </div>

        <p className="mt-4 break-all text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
          {voteUrl}
        </p>
      </section>
    </main>
  )
}

function ResultPhase({ match }: { match: PublicActiveMatch }) {
  const t1Score = match.team1FinalScore ?? 0
  const t2Score = match.team2FinalScore ?? 0
  const winnerId = match.winnerId
  const t1IsWinner = winnerId === match.team1?.id
  const t2IsWinner = winnerId === match.team2?.id
  const isTie = match.isTie ?? false
  const tieReason = match.tieReason

  let subtitle: string | null = null
  if (isTie && tieReason === "NO_VOTES") {
    subtitle = "لم يتم تسجيل أي تصويت، وتم اعتبار النتيجة تعادلاً."
  } else if (isTie && tieReason === "EQUAL_SCORE") {
    subtitle = "النتيجة متعادلة وتحتاج إلى كسر التعادل."
  }

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 md:gap-8 md:py-10">
      <section className="rounded-[1.7rem] border border-amber-200 bg-white/90 px-6 py-4 text-center shadow-xl shadow-amber-100 backdrop-blur-xl sm:px-8 sm:py-5">
        <h2 className="text-3xl font-black leading-tight text-amber-600 sm:text-4xl md:text-5xl">
          النتيجة النهائية
        </h2>
      </section>

      {subtitle && (
        <section className="w-full max-w-2xl rounded-[1.7rem] border border-yellow-200 bg-yellow-50/90 px-6 py-4 text-center shadow-xl shadow-yellow-100/80 backdrop-blur-xl sm:px-8 sm:py-5">
          <p className="text-xl font-bold leading-tight text-yellow-800 sm:text-2xl md:text-3xl">
            {subtitle}
          </p>
        </section>
      )}

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-4 sm:gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <ResultTeamCard
          label={match.team1?.name ?? "الفريق الأول"}
          imageUrl={match.team1?.imageUrl}
          score={t1Score}
          isWinner={t1IsWinner}
          align="right"
          scoreTone="sky"
        />

        <VSBadge />

        <ResultTeamCard
          label={match.team2?.name ?? "الفريق الثاني"}
          imageUrl={match.team2?.imageUrl}
          score={t2Score}
          isWinner={t2IsWinner}
          align="left"
          scoreTone="emerald"
        />
      </div>
    </main>
  )
}

function ResultTeamCard({
  label,
  imageUrl,
  score,
  isWinner,
  align,
  scoreTone,
}: {
  label: string
  imageUrl?: string | null
  score: number
  isWinner: boolean
  align: "right" | "left" | "center"
  scoreTone: "sky" | "emerald"
}) {
  const alignmentClass =
    align === "right"
      ? "justify-self-end"
      : align === "left"
        ? "justify-self-start"
        : "justify-self-center"

  const scoreClass = scoreTone === "sky" ? "text-sky-700" : "text-emerald-700"

  return (
    <section
      className={`w-[82%] max-w-[19rem] rounded-[1.7rem] border p-4 text-center shadow-xl backdrop-blur-xl sm:w-full sm:max-w-sm sm:p-5 md:max-w-md md:p-6 ${alignmentClass} ${
        isWinner
          ? "border-amber-300 bg-amber-50/95 shadow-amber-100 ring-2 ring-amber-200"
          : "border-white/85 bg-white/86 shadow-sky-100/80 opacity-90"
      }`}
    >
      <div className="mx-auto w-fit rounded-[1.5rem] bg-amber-100/80 p-3 shadow-lg ring-2 ring-amber-300/50 sm:p-4">
        <div className="rounded-full bg-white p-1.5 shadow-md ring-4 ring-white/80 sm:p-2">
          <TeamAvatar name={label} imageUrl={imageUrl} size="xl" />
        </div>
      </div>

      <h2 className="mt-4 line-clamp-2 text-xl font-black leading-tight text-slate-900 sm:text-2xl md:text-3xl">
        {label}
      </h2>

      <div
        className={`mx-auto mt-4 w-fit rounded-3xl bg-white px-6 py-3 text-4xl font-black leading-none shadow-lg sm:text-5xl md:text-6xl ${scoreClass}`}
      >
        {score}%
      </div>

      {isWinner && (
        <div className="mx-auto mt-4 w-fit rounded-full bg-amber-400 px-5 py-2 text-base font-black text-white shadow-lg shadow-amber-200 sm:text-lg">
          الفائز
        </div>
      )}
    </section>
  )
}

export default function DisplayPage() {
  const [match, setMatch] = useState<PublicActiveMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch("/api/public/active-match", { cache: "no-store" })
      const json = await res.json()

      console.log("[PUBLIC_DISPLAY_POLL_TICK]", JSON.stringify({
        timestamp: new Date().toISOString(),
        responseStatus: res.status,
        hasData: !!json.data,
        hasError: !!json.error,
        challengeId: json.data?.id,
        activePresentationTeam: json.data?.activePresentationTeam,
        team1Remaining: json.data?.team1TimerSnapshot?.remainingSeconds,
        team2Remaining: json.data?.team2TimerSnapshot?.remainingSeconds,
        serverNow: json.data?.serverNow,
      }))

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

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMatch()
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchMatch])

  if (loading) {
    return <StatusScreen title="جاري تجهيز شاشة العرض..." />
  }

  if (error) {
    return <StatusScreen title={`تعذر تحميل بيانات العرض: ${error}`} tone="error" />
  }

  if (!match) {
    return <StatusScreen title="لا توجد مباراة نشطة الآن" />
  }

  console.log("[DISPLAY_TIMER_STATE]", JSON.stringify({
    challengeId: match.id,
    phase: match.phase,
    activePresentationTeam: match.activePresentationTeam,
    team1: { status: match.team1TimerSnapshot.status, remainingSeconds: match.team1TimerSnapshot.remainingSeconds },
    team2: { status: match.team2TimerSnapshot.status, remainingSeconds: match.team2TimerSnapshot.remainingSeconds },
    voting: { status: match.votingTimerSnapshot.status, remainingSeconds: match.votingTimerSnapshot.remainingSeconds },
    serverNow: match.serverNow,
  }))

  return (
    <div className={pageShellClass} dir="rtl">
      {backgroundLayer}

      <header className="relative z-10 mx-3 mt-3 flex items-center justify-between gap-3 rounded-[1.7rem] border border-white/85 bg-white/86 px-4 py-4 shadow-xl shadow-sky-100/70 backdrop-blur-xl sm:mx-5 sm:mt-5 sm:px-6 md:mx-8 md:mt-6 md:py-5">
        <h1 className="min-w-0 truncate text-lg font-black text-sky-950 sm:text-2xl md:text-3xl lg:text-4xl">
          {match.name}
        </h1>

        <a
          href="/bracket"
          className="shrink-0 rounded-full border border-amber-300 bg-amber-400 px-4 py-2 text-xs font-black text-slate-900 shadow-md shadow-amber-100 transition duration-300 hover:bg-amber-300 sm:px-5 sm:text-sm md:text-base"
        >
          شجرة المنافسة
        </a>
      </header>

      {match.phase === "PRESENTING" && <PresentationPhase match={match} />}

      {match.phase === "VOTING" && <VotingPhase match={match} />}

      {(match.phase === "RESULT" || match.phase === "FINISHED") && (
        <ResultPhase match={match} />
      )}

      {match.phase === "WAITING" && (
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6">
          <div className="rounded-[1.7rem] border border-white/85 bg-white/88 px-6 py-6 text-center text-2xl font-black text-sky-900 shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-10 sm:py-8 sm:text-3xl md:text-4xl">
            في انتظار بدء التحدي
          </div>
        </main>
      )}
    </div>
  )
}