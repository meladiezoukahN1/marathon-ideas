"use client"
import { useState, FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ username: "", password: "" })
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const res = await signIn("credentials", { ...form, redirect: false })
    if (res?.ok) {
      const s = await fetch("/api/auth/session").then(r => r.json())
      const role = s?.user?.role
      if (role === "JURY")                               router.push("/jury")
      else if (role === "ADMIN" || role === "SUPERADMIN") router.push("/admin")
      else router.push("/display")
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="text-2xl font-black text-gray-900">ماراثون الأفكار</h1>
          <p className="text-gray-500 text-sm mt-1">تسجيل دخول</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="اسم المستخدم" value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
          <Input label="كلمة المرور" type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">دخول</Button>
        </form>
      </div>
    </div>
  )
}
