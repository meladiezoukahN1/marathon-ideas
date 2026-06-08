"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PublicActiveMatch } from "@/server/modules/matches/types"
import type { TimerSnapshot } from "@/lib/timer-snapshot"
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

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const pageShellClass =
  "relative min-h-screen overflow-hidden text-white flex flex-col"

const backgroundLayer = (
  <>
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/BACKGROUND-01.png')",
      }}
    />
    <div className="absolute inset-0 bg-slate-950/75" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(16,185,129,0.08),transparent_34%)]" />
  </>
)

type PresentingTeam = {
  slot: "TEAM1" | "TEAM2"
  name: string
  imageUrl?: string | null
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
        <div className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-slate-950/60 px-6 py-7 text-center shadow-xl shadow-black/35 backdrop-blur-xl sm:px-10 sm:py-9">
          <div
            className={`text-2xl font-black leading-tight sm:text-3xl md:text-4xl ${
              tone === "error" ? "text-rose-300" : "text-white"
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
  return (
    snap.status === "RUNNING" ||
    snap.status === "PAUSED" ||
    snap.status === "SCHEDULED"
  )
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
      snapshot: match.team1TimerSnapshot,
    }
  }

  if (mode === "TEAM2_PRESENTING") {
    return {
      slot: "TEAM2",
      name: match.team2?.name ?? "الفريق الثاني",
      imageUrl: match.team2?.imageUrl,
      snapshot: match.team2TimerSnapshot,
    }
  }

  return null
}

function TeamLogoBox({
  name,
  imageUrl,
  size = "md",
}: {
  name: string
  imageUrl?: string | null
  size?: "sm" | "md" | "lg"
}) {
  const boxClass =
    size === "lg"
      ? "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
      : size === "sm"
        ? "h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20"
        : "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"

  return (
    <div className="mx-auto w-fit rounded-[1.35rem] border border-white/15 bg-white/8 p-2.5 shadow-xl shadow-black/35 backdrop-blur-xl">
      <div
        className={`relative flex ${boxClass} items-center justify-center overflow-hidden rounded-[1.05rem] border border-white/15 bg-white/95 p-2.5`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[0.9rem] bg-slate-950 text-2xl font-black text-white sm:text-3xl">
            {getInitials(name)}
          </div>
        )}
      </div>
    </div>
  )
}

function VSBadge() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-2xl font-black text-white shadow-xl shadow-black/30 backdrop-blur-xl sm:h-20 sm:w-20 sm:text-3xl md:h-24 md:w-24 md:text-4xl">
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
      className={`w-[82%] max-w-[20rem] rounded-[1.7rem] border border-white/15 bg-slate-950/60 p-5 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:w-full sm:max-w-sm sm:p-6 md:max-w-md md:p-7 ${alignmentClass}`}
    >
      <TeamLogoBox name={label} imageUrl={imageUrl} size="md" />

      <h2 className="mt-5 line-clamp-2 text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
        {label}
      </h2>

      {status && (
        <div className="mx-auto mt-4 w-fit rounded-full border border-sky-300/30 bg-sky-400/15 px-5 py-2 text-sm font-black text-sky-100 shadow-sm sm:text-base">
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
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-4 py-5 sm:gap-10 sm:px-6 sm:py-7 md:gap-16 md:py-8">
      <section className="w-full max-w-3xl rounded-[2rem] border border-white/15 bg-slate-950/60 px-6 py-6 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:px-8 sm:py-7">
        <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-slate-300 sm:text-lg">
          {description}
        </p>
      </section>

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
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
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-[2rem] border border-amber-300/40 bg-amber-400/15 px-10 py-5 text-6xl font-black leading-none text-amber-200 shadow-xl shadow-black/25 sm:text-7xl md:text-8xl">
        {remaining}
      </div>
      <div className="text-2xl font-black text-amber-100 sm:text-3xl">
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
      ? "border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-black/30"
      : status === "RUNNING"
        ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100 shadow-black/30 ring-2 ring-emerald-300/30"
        : status === "SCHEDULED"
          ? "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-black/30 ring-2 ring-amber-300/30"
          : "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-black/30 ring-2 ring-amber-300/30"

  const slotLabel = team.slot === "TEAM1" ? "الفريق الأول" : "الفريق الثاني"

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-7 md:py-10">
      <section className="mx-auto w-full max-w-5xl rounded-[2.4rem] border border-white/15 bg-slate-950/65 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 md:p-10 lg:p-12">
        <div className="mx-auto mb-6 w-fit rounded-full border border-sky-300/30 bg-sky-400/15 px-6 py-2 text-base font-black text-sky-100 shadow-sm sm:text-lg">
          يعرض الآن: {slotLabel}
        </div>

        {status === "SCHEDULED" && snap.startsAt ? (
          <ScheduleCountdown startsAt={snap.startsAt} />
        ) : status === "PAUSED" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-[2rem] border border-amber-400/50 bg-amber-400/15 px-10 py-5 font-mono text-6xl font-black leading-none text-amber-100 shadow-xl shadow-black/30 sm:text-7xl md:text-8xl">
              {formatTime(remaining)}
            </div>
            <div className="text-2xl font-black text-amber-100 sm:text-3xl">
              متوقف
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto w-fit rounded-[2rem] border px-8 py-5 font-mono text-7xl font-black leading-none shadow-xl sm:px-10 sm:py-6 sm:text-8xl md:text-9xl lg:text-[9.5rem] ${timerClass}`}
          >
            {formatTime(remaining)}
          </div>
        )}

        <div className="mt-7">
          <TeamLogoBox name={team.name} imageUrl={team.imageUrl} size="lg" />
        </div>

        <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {team.name}
        </h2>

        {status !== "SCHEDULED" && (
          <div className="mx-auto mt-6 w-fit rounded-full border border-white/15 bg-white/10 px-6 py-2 text-base font-black text-white shadow-lg shadow-black/25 sm:text-lg">
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
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-5 sm:gap-7 sm:px-6 sm:py-7 md:gap-8 md:py-10">
      <section className="rounded-[1.7rem] border border-emerald-300/30 bg-emerald-400/15 px-8 py-4 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:px-10 sm:py-5">
        <h2 className="text-4xl font-black leading-tight text-emerald-100 sm:text-5xl md:text-6xl">
          التصويت مفتوح
        </h2>
      </section>

      <div
        className={`rounded-[1.7rem] border px-8 py-5 font-mono text-6xl font-black leading-none shadow-xl sm:text-7xl md:text-8xl ${
          countdown > 0
            ? "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-black/30 ring-2 ring-amber-300/30"
            : "border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-black/30"
        }`}
      >
        {status === "PAUSED" ? (
  <div className="flex flex-col items-center gap-2">
    <span className="text-4xl font-black sm:text-5xl md:text-6xl">
      متوقف
    </span>
    <span className="text-lg font-black text-amber-100 sm:text-xl">
      {/* الوقت المتبقي: {formatCountdown(countdown)} */}
    </span>
  </div>
) : (
  formatCountdown(countdown)
)}
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
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

      <section className="w-full max-w-md rounded-[1.7rem] border border-white/15 bg-slate-950/65 p-5 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:p-6">
        <p className="mb-4 text-xl font-black text-white sm:text-2xl">
          امسح الرمز للتصويت
        </p>

        <div className="mx-auto w-fit rounded-3xl bg-white p-3 shadow-lg shadow-black/30 sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
              voteUrl,
            )}`}
            alt="رمز التصويت"
            className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52"
          />
        </div>

        <p className="mt-4 break-all text-sm font-semibold leading-relaxed text-slate-300 sm:text-base">
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
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-5 sm:gap-7 sm:px-6 sm:py-7 md:gap-8 md:py-10">
      <section className="rounded-[1.7rem] border border-amber-300/40 bg-amber-400/15 px-8 py-4 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:px-10 sm:py-5">
        <h2 className="text-4xl font-black leading-tight text-amber-100 sm:text-5xl md:text-6xl">
          النتيجة النهائية
        </h2>
      </section>

      {subtitle && (
        <section className="w-full max-w-3xl rounded-[1.7rem] border border-yellow-300/40 bg-yellow-400/15 px-6 py-4 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:px-8 sm:py-5">
          <p className="text-2xl font-black leading-tight text-yellow-100 sm:text-3xl md:text-4xl">
            {subtitle}
          </p>
        </section>
      )}

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
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

  const scoreClass = scoreTone === "sky" ? "text-sky-100" : "text-emerald-100"

  return (
    <section
      className={`w-[82%] max-w-[20rem] rounded-[1.7rem] border p-5 text-center shadow-xl backdrop-blur-xl sm:w-full sm:max-w-sm sm:p-6 md:max-w-md md:p-7 ${alignmentClass} ${
        isWinner
          ? "border-amber-400/60 bg-amber-400/20 shadow-black/30 ring-2 ring-amber-300/30"
          : "border-white/15 bg-slate-950/55 shadow-black/30 opacity-95"
      }`}
    >
      <TeamLogoBox name={label} imageUrl={imageUrl} size="md" />

      <h2 className="mt-5 line-clamp-2 text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
        {label}
      </h2>

      <div
        className={`mx-auto mt-5 w-fit rounded-3xl border border-white/10 bg-slate-950/65 px-7 py-4 text-5xl font-black leading-none shadow-lg shadow-black/30 sm:text-6xl md:text-7xl ${scoreClass}`}
      >
        {score}%
      </div>

      {isWinner && (
        <div className="mx-auto mt-5 w-fit rounded-full border border-amber-300/40 bg-amber-400/25 px-6 py-2 text-base font-black text-amber-100 shadow-lg shadow-black/25 sm:text-lg">
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

  return (
    <div className={pageShellClass} dir="rtl">
      {backgroundLayer}

      <header className="relative z-10 mx-3 mt-3 flex items-center justify-between gap-3 rounded-[1.7rem] border border-white/15 bg-slate-950/60 px-4 py-4 shadow-xl shadow-black/30 backdrop-blur-xl sm:mx-5 sm:mt-5 sm:px-6 md:mx-8 md:mt-6 md:py-5">
        <h1 className="min-w-0 truncate text-lg font-black text-white sm:text-2xl md:text-3xl lg:text-4xl">
          {match.name}
        </h1>

        <a
          href="/bracket"
          className="shrink-0 rounded-full border border-amber-400/50 bg-amber-400/20 px-4 py-2 text-xs font-black text-amber-100 shadow-md shadow-black/25 transition duration-300 hover:bg-amber-400/30 sm:px-5 sm:text-sm md:text-base"
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
          <div className="rounded-[1.7rem] border border-white/15 bg-slate-950/60 px-6 py-6 text-center text-3xl font-black text-white shadow-xl shadow-black/30 backdrop-blur-xl sm:px-10 sm:py-8 sm:text-4xl md:text-5xl">
            في انتظار بدء التحدي
          </div>
        </main>
      )}
    </div>
  )
}