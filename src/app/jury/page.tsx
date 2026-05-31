"use client"

import { useEffect, useMemo, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { JuryVoteCard } from "@/components/jury/JuryVoteCard"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { Badge } from "@/components/ui/Badge"
import type { ChallengePublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

type ChallengeGroup = {
  active: ChallengePublic[]
  waiting: ChallengePublic[]
  done: ChallengePublic[]
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

function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    await signOut({
      callbackUrl: "/login",
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 shadow-sm transition duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
    >
      {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  )
}

function PageHeader({ name }: { name?: string | null }) {
  return (
    <header className="rounded-[2rem] border border-white/85 bg-white/88 px-5 py-6 shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-8 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {name && (
            <div className="max-w-full truncate rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-800 shadow-sm sm:text-sm">
              مرحباً، {name}
            </div>
          )}
        </div>

        <LogoutButton />
      </div>

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-4xl shadow-lg shadow-amber-100 sm:h-20 sm:w-20">
          ⚖️
        </div>

        <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">
          لجنة التحكيم
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
          اختر التحدي المفتوح، قيّم الفرق، ثم أرسل صوتك مرة واحدة لكل مواجهة.
        </p>
      </div>
    </header>
  )
}

function StatsBar({ groups }: { groups: ChallengeGroup }) {
  return (
    <section className="grid grid-cols-3 gap-3">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 text-center shadow-lg shadow-emerald-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-emerald-700 sm:text-3xl">
          {groups.active.length}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          مفتوحة
        </div>
      </div>

      <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-4 text-center shadow-lg shadow-sky-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-sky-700 sm:text-3xl">
          {groups.waiting.length}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          انتظار
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-center shadow-lg shadow-amber-100/70 backdrop-blur-xl">
        <div className="text-2xl font-black text-amber-600 sm:text-3xl">
          {groups.done.length}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600 sm:text-sm">
          مكتملة
        </div>
      </div>
    </section>
  )
}

function LoadingContent() {
  return (
    <div className="space-y-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

function ActiveVotingSection({
  challenges,
  onVoted,
}: {
  challenges: ChallengePublic[]
  onVoted: (id: string) => void
}) {
  if (challenges.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-emerald-800 sm:text-2xl">
          تحديات مفتوحة للتصويت
        </h2>

        <div className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-800 sm:text-sm">
          {challenges.length}
        </div>
      </div>

      {challenges.map((challenge) => (
        <article
          key={challenge.id}
          className="overflow-hidden rounded-[2rem] border-2 border-emerald-300 bg-white/92 shadow-xl shadow-emerald-100/80 backdrop-blur-xl"
        >
          <div className="h-1.5 bg-gradient-to-l from-emerald-300 via-emerald-400 to-sky-400" />

          <div className="p-4 sm:p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Badge label="مفتوح للتصويت" variant="success" size="md" />

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 sm:text-sm">
                نشط الآن
              </span>
            </div>

            <JuryVoteCard
              challenge={challenge}
              onVoted={() => onVoted(challenge.id)}
            />
          </div>
        </article>
      ))}
    </section>
  )
}

function WaitingSection({ challenges }: { challenges: ChallengePublic[] }) {
  if (challenges.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-sky-900 sm:text-2xl">
          في انتظار فتح التصويت
        </h2>

        <div className="rounded-full bg-sky-100 px-4 py-1.5 text-xs font-black text-sky-800 sm:text-sm">
          {challenges.length}
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <article
            key={challenge.id}
            className="rounded-[1.7rem] border border-white/85 bg-white/86 p-4 shadow-lg shadow-sky-100/70 backdrop-blur-xl sm:p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-900 sm:text-lg">
                  {challenge.name}
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  سيظهر نموذج التحكيم عند فتح التصويت
                </p>
              </div>

              <div className="shrink-0">
                <Badge label="انتظار" variant="neutral" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function DoneSection({ challenges }: { challenges: ChallengePublic[] }) {
  if (challenges.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-amber-700 sm:text-2xl">
          تم التصويت
        </h2>

        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-700 sm:text-sm">
          {challenges.length}
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <article
            key={challenge.id}
            className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50/90 px-4 py-4 shadow-lg shadow-emerald-100/70 backdrop-blur-xl sm:px-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-white shadow-md shadow-emerald-100">
                ✓
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-emerald-900 sm:text-lg">
                  {challenge.name}
                </h3>

                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                  تم إرسال تقييمك بنجاح
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-white/85 bg-white/88 px-6 py-12 text-center shadow-xl shadow-sky-100/80 backdrop-blur-xl sm:px-8 sm:py-16">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-3xl shadow-lg shadow-sky-100 sm:h-20 sm:w-20 sm:text-4xl">
        📋
      </div>

      <h2 className="text-2xl font-black text-sky-950 sm:text-3xl">
        لا توجد تحديات بعد
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
        عند إنشاء التحديات وفتح التصويت ستظهر هنا مباشرة.
      </p>
    </section>
  )
}

export default function JuryPage() {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<ChallengePublic[]>([])
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  function load() {
    fetch(`/api/challenges?eventId=${EVENT_ID}`)
      .then((response) => response.json())
      .then((json) => {
        if (json.data) setChallenges(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()

    const timer = setInterval(load, 1000)

    return () => clearInterval(timer)
  }, [])

  const groups = useMemo<ChallengeGroup>(() => {
    const active = challenges.filter(
      (challenge) =>
        challenge.phase === "VOTING" && !votedIds.has(challenge.id),
    )

    const waiting = challenges.filter(
      (challenge) =>
        challenge.phase !== "VOTING" && !votedIds.has(challenge.id),
    )

    const done = challenges.filter((challenge) => votedIds.has(challenge.id))

    return { active, waiting, done }
  }, [challenges, votedIds])

  function handleVoted(id: string) {
    setVotedIds((previous) => new Set([...previous, id]))
  }

  const hasNoChallenges = !loading && challenges.length === 0

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900"
      dir="rtl"
    >
      <PageBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-10">
        <div className="space-y-5 sm:space-y-6">
          <PageHeader name={session?.user?.name} />

          {!hasNoChallenges && <StatsBar groups={groups} />}

          {loading && <LoadingContent />}

          {hasNoChallenges && <EmptyState />}

          {!loading && !hasNoChallenges && (
            <div className="space-y-7 sm:space-y-8">
              <ActiveVotingSection
                challenges={groups.active}
                onVoted={handleVoted}
              />

              <WaitingSection challenges={groups.waiting} />

              <DoneSection challenges={groups.done} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}