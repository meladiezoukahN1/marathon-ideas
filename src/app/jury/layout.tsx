import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import type { ReactNode } from "react"
export default async function JuryLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session)                     redirect("/login")
  if (session.user.role !== "JURY") redirect("/")
  return <>{children}</>
}
