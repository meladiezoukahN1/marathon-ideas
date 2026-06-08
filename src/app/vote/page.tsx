"use client"

import { useEffect, useState } from "react"
import {
  generateVoterToken,
  hasVotedLocally,
  markVotedLocally,
} from "@/lib/fingerprint"
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

function formatCountdown(seconds: number): string {
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

function PageBackground() {
  return (
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
}

function TeamLogoBox({
  name,
  imageUrl,
}: {
  name: string
  imageUrl?: string | null
}) {
  return (
    <div className="mx-auto w-fit rounded-[1.35rem] border border-white/15 bg-white/8 p-2.5 shadow-xl shadow-black/35 backdrop-blur-xl">
      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.05rem] border border-white/15 bg-white/95 p-2.5 sm:h-24 sm:w-24">
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

function StatusScreen({
  title,
  subtitle,
  actionLabel,
  actionHref,
  tone = "neutral",
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  tone?: "neutral" | "success" | "warning" | "error"
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/40 bg-amber-400/15 text-amber-100"
        : tone === "error"
          ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
          : "border-white/15 bg-slate-950/65 text-white"

  return (
    <div className="relative min-h-screen overflow-hidden text-white" dir="rtl">
      <PageBackground />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <section
          className={`w-full max-w-md rounded-[2rem] border px-6 py-8 text-center shadow-2xl shadow-black/40 backdrop-blur-xl ${toneClass}`}
        >
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-relaxed text-slate-200 sm:text-base">
              {subtitle}
            </p>
          )}

          {actionHref && actionLabel && (
            <a
              href={actionHref}
              className="mx-auto mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-black text-white shadow-lg shadow-black/25 transition hover:bg-white/15"
            >
              {actionLabel}
            </a>
          )}
        </section>
      </main>
    </div>
  )
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
    fetch("/api/public/active-challenge", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (json.data) {
          setChallenge(json.data)

          if (hasVotedLocally(json.data.id, json.data.votingSessionId)) {
            setAlreadyVoted(true)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!challenge?.votingEndsAt) return

    const updateCountdown = () => {
      const remaining = Math.floor(
        (new Date(challenge.votingEndsAt!).getTime() - Date.now()) / 1000,
      )
      setCountdown(Math.max(0, remaining))
    }

    updateCountdown()

    const iv = setInterval(updateCountdown, 1000)
    return () => clearInterval(iv)
  }, [challenge?.votingEndsAt])

  async function submitVote() {
    if (!selected || !challenge || submitting) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          teamId: selected,
          voterToken: token,
        }),
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
        setError(
          json.error === "VOTING_NOT_OPEN"
            ? "التصويت غير متاح حالياً"
            : "حدث خطأ أثناء تسجيل التصويت، حاول مجدداً",
        )
      }
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مجدداً")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <StatusScreen
        title="جاري تحميل التصويت..."
        subtitle="يتم تجهيز بيانات المواجهة والفرق"
      />
    )
  }

  if (!challenge) {
    return (
      <StatusScreen
        title="لا يوجد تحدٍ نشط حالياً"
        subtitle="لم يتم تحديد تحدٍ نشط. يرجى الانتظار حتى يبدأ المسؤول التحدي."
        actionHref="/bracket"
        actionLabel="عرض شجرة المنافسة"
      />
    )
  }

  if (challenge.phase === "WAITING") {
    return (
      <StatusScreen
        title={challenge.title}
        subtitle="التحدي في مرحلة الانتظار. لم يبدأ العرض بعد."
        actionHref="/bracket"
        actionLabel="عرض شجرة المنافسة"
      />
    )
  }

  if (challenge.phase === "PRESENTING") {
    return (
      <StatusScreen
        title={challenge.title}
        subtitle="جاري عرض الفرق. سيتم فتح التصويت بعد انتهاء العرض."
        actionHref="/bracket"
        actionLabel="عرض شجرة المنافسة"
        tone="warning"
      />
    )
  }

  if (challenge.phase === "RESULT" || challenge.phase === "FINISHED") {
    return (
      <StatusScreen
        title={challenge.title}
        subtitle="انتهى التصويت وتم الإعلان عن النتيجة."
        actionHref="/bracket"
        actionLabel="عرض النتائج الكاملة"
        tone="success"
      />
    )
  }

  if (challenge.phase !== "VOTING") {
    return (
      <StatusScreen
        title="التصويت غير متاح حالياً"
        subtitle={`التحدي في مرحلة ${getChallengePhaseLabel(challenge.phase)}.`}
        actionHref="/bracket"
        actionLabel="عرض النتائج الكاملة"
        tone="warning"
      />
    )
  }

  if (countdown <= 0 && challenge.votingEndsAt) {
    return (
      <StatusScreen
        title={challenge.title}
        subtitle="انتهى وقت التصويت. لم يعد بإمكانك التصويت في هذا التحدي."
        actionHref="/bracket"
        actionLabel="عرض النتائج الكاملة"
        tone="error"
      />
    )
  }

  if (voted || alreadyVoted) {
    return (
      <StatusScreen
        title={
          alreadyVoted
            ? "لقد قمت بالتصويت سابقاً"
            : "تم تسجيل تصويتك بنجاح"
        }
        subtitle="شكراً لمشاركتك. يمكنك متابعة النتائج من شاشة المنافسة."
        actionHref="/bracket"
        actionLabel="عرض النتائج الكاملة"
        tone="success"
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white" dir="rtl">
      <PageBackground />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
        <section className="w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950/65 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
          <header className="mb-5 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border border-emerald-300/30 bg-emerald-400/15 px-5 py-2 text-sm font-black text-emerald-100 shadow-sm">
              التصويت مفتوح
            </div>

            <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              {challenge.title}
            </h1>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
              اختر الفريق الذي تريد التصويت له، ثم اضغط تأكيد التصويت.
            </p>

            {countdown > 0 && (
              <div className="mx-auto mt-4 w-fit rounded-full border border-amber-300/35 bg-amber-400/15 px-5 py-2 font-mono text-sm font-black text-amber-100 shadow-lg shadow-black/25">
                الوقت المتبقي: {formatCountdown(countdown)}
              </div>
            )}
          </header>

          <div className="space-y-4">
            {[challenge.team1, challenge.team2].map(
              (team) =>
                team && (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelected(team.id)}
                    className={`w-full rounded-[1.7rem] border p-4 text-center shadow-xl backdrop-blur-xl transition duration-200 sm:p-5 ${
                      selected === team.id
                        ? "scale-[1.01] border-emerald-300/60 bg-emerald-400/20 shadow-emerald-950/30 ring-2 ring-emerald-300/30"
                        : "border-white/15 bg-white/10 shadow-black/25 hover:border-white/25 hover:bg-white/15"
                    }`}
                  >
                    <TeamLogoBox name={team.name} imageUrl={team.imageUrl} />

                    <div className="mt-4 line-clamp-2 text-xl font-black leading-tight text-white sm:text-2xl">
                      {team.name}
                    </div>

                    <div
                      className={`mx-auto mt-4 w-fit rounded-full border px-5 py-2 text-sm font-black transition ${
                        selected === team.id
                          ? "border-emerald-300/40 bg-emerald-400/25 text-emerald-100"
                          : "border-white/15 bg-slate-950/45 text-slate-200"
                      }`}
                    >
                      {selected === team.id
                        ? "تم اختيار هذا الفريق"
                        : "التصويت لهذا الفريق"}
                    </div>
                  </button>
                ),
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-center text-sm font-bold text-rose-100">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submitVote}
            disabled={!selected || submitting}
            className="mt-5 w-full rounded-2xl border border-emerald-300/40 bg-emerald-500 px-5 py-3 text-lg font-black text-white shadow-xl shadow-emerald-950/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-400"
          >
            {submitting ? "جاري تسجيل التصويت..." : "تأكيد التصويت"}
          </button>

          <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-slate-400">
            يمكنك التصويت مرة واحدة فقط
          </p>
        </section>
      </main>
    </div>
  )
}