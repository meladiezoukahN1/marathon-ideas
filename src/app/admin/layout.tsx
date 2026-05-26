import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminNav } from "@/components/admin/AdminNav"
import type { ReactNode } from "react"
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!["ADMIN","SUPERADMIN"].includes(session.user.role as string)) redirect("/")
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <AdminNav role={session.user.role} username={session.user.name ?? ""} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  )
}
