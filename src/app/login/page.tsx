"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      ...form,
      redirect: false,
    })

    if (res?.ok) {
      const session = await fetch("/api/auth/session").then((response) =>
        response.json(),
      )

      const role = session?.user?.role

      if (role === "JURY") router.push("/jury")
      else if (role === "ADMIN" || role === "SUPERADMIN") router.push("/admin")
      else router.push("/display")
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة")
    }

    setLoading(false)
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(245,158,11,0.2),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.14),transparent_36%),linear-gradient(135deg,#fffdf7_0%,#eef8ff_48%,#f8fafc_100%)]" />
      <div className="absolute inset-0 bg-white/35" />
      <div className="absolute right-[-90px] top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute left-[-90px] bottom-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl sm:h-72 sm:w-72" />

      <section className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 xl:px-16">
        <div className="mx-auto hidden w-full max-w-2xl lg:block">
          <div className="rounded-[2.5rem] border border-white/85 bg-white/70 p-8 shadow-2xl shadow-sky-100/80 backdrop-blur-xl xl:p-10">
            <div className="mb-8 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-black text-amber-700 shadow-sm">
              منصة إدارة ماراثون الأفكار
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-tight text-sky-950 xl:text-5xl">
              دخول سريع لإدارة التحديات والتصويت والعرض المباشر
            </h1>

            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-slate-600">
              واجهة مخصصة لفريق الإدارة، لجنة التحكيم، وشاشة الجمهور. كل مستخدم
              يتم توجيهه تلقائيًا حسب صلاحياته بعد تسجيل الدخول.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-3xl border border-white/90 bg-white/85 p-5 text-center shadow-lg shadow-sky-100/70">
                <div className="text-3xl font-black text-sky-700">Admin</div>
                <div className="mt-2 text-sm font-bold text-slate-500">
                  التحكم الكامل
                </div>
              </div>

              <div className="rounded-3xl border border-white/90 bg-white/85 p-5 text-center shadow-lg shadow-emerald-100/70">
                <div className="text-3xl font-black text-emerald-700">
                  Jury
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">
                  تقييم الفرق
                </div>
              </div>

              <div className="rounded-3xl border border-white/90 bg-white/85 p-5 text-center shadow-lg shadow-amber-100/70">
                <div className="text-3xl font-black text-amber-600">
                  Live
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">
                  عرض الجمهور
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[2.2rem] border border-white/85 bg-white/90 p-5 shadow-2xl shadow-sky-100/80 backdrop-blur-xl sm:p-7 md:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-4xl shadow-lg shadow-amber-100 sm:h-20 sm:w-20">
                🏆
              </div>

              <h1 className="text-3xl font-black leading-tight text-sky-950 sm:text-4xl">
                ماراثون الأفكار
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
                تسجيل الدخول إلى المنصة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="اسم المستخدم"
                value={form.username}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    username: e.target.value,
                  }))
                }
                required
              />

              <Input
                label="كلمة المرور"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    password: e.target.value,
                  }))
                }
                required
              />

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-600 shadow-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-2xl shadow-lg shadow-sky-100"
                size="lg"
              >
                دخول
              </Button>
            </form>

            
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-slate-500 sm:text-sm">
            نظام إدارة المنافسة والتصويت والعرض المباشر
          </p>
        </div>
      </section>
    </main>
  )
}