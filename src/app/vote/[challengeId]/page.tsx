"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  generateVoterToken,
  hasVotedLocally,
  markVotedLocally,
} from "@/lib/fingerprint"
import { TeamAvatar } from "@/components/common/team-avatar"
import type { ChallengePublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

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
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.05rem] border border-white/15 bg-white/95 p-2 sm:h-24 sm:w-24">
        <TeamAvatar name={name} imageUrl={imageUrl} size="lg" />
      </div>
    </div>
  )
}

function StatusCard({
  title,
  subtitle,
  tone = "neutral",
}: {
  title: string
  subtitle?: string
  tone?: "neutral" | "success" | "error" | "locked"
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
      : tone === "error"
        ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
        : tone === "locked"
          ? "border-amber-400/40 bg-amber-400/15 text-amber-100"
          : "border-white/15 bg-slate-950/65 text-white"

  return (
    <div className="relative min-h-screen overflow-hidden text-white" dir="rtl">
      <PageBackground />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
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
        </section>
      </main>
    </div>
  )
}

export default function VotePage() {
  const { challengeId } = useParams<{ challengeId: string }>()
  const [challenge, setChallenge] = useState<ChallengePublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [token] = useState(() =>
    typeof window !== "undefined" ? generateVoterToken() : "tok",
  )

  useEffect(() => {
    fetch(`/api/challenges?eventId=${EVENT_ID}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        const found = (json.data ?? []).find(
          (item: ChallengePublic) => item.id === challengeId,
        )

        setChallenge(found ?? null)

        if (found && hasVotedLocally(challengeId, found.votingSessionId)) {
          setVoted(true)
        }
      })
      .catch(() => {
        setError("تعذر تحميل بيانات التصويت")
      })
      .finally(() => setLoading(false))
  }, [challengeId])

  async function submitVote() {
    if (!selected || submitting) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          teamId: selected,
          voterToken: token,
        }),
      })

      const json = await res.json()

      if (json.data?.success || json.error === "ALREADY_VOTED") {
        markVotedLocally(challengeId, challenge?.votingSessionId)
        setVoted(true)
      } else {
        console.log("Vote error:", json)
        setError("حدث خطأ أثناء تسجيل التصويت، حاول مجدداً")
      }
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مجدداً")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <StatusCard
        title="جاري تحميل التصويت..."
        subtitle="يتم تجهيز بيانات المواجهة والفرق"
      />
    )
  }

  if (!challenge || challenge.phase !== "VOTING") {
    return (
      <StatusCard
        title="التصويت غير مفتوح حالياً"
        subtitle="سيتم تفعيل التصويت من لوحة التحكم عند بدء مرحلة التصويت."
        tone="locked"
      />
    )
  }

  if (voted) {
    return (
      <StatusCard
        title="تم تسجيل صوتك"
        subtitle="شكراً لمشاركتك. لا يمكن التصويت أكثر من مرة في نفس التحدي."
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
              {challenge.name}
            </h1>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
              اختر الفريق الذي تريد التصويت له، ثم اضغط تأكيد التصويت.
            </p>
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
            يمكنك التصويت مرة واحدة فقط في هذا التحدي
          </p>
        </section>
      </main>
    </div>
  )
}