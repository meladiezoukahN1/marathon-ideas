import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import type { ReactNode } from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ماراثون الأفكار - لجنة التحكيم",
  description: "لجنة التحكيم للماراثون",
}

export default async function JuryLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session)                     redirect("/login")
  if (session.user.role !== "JURY") redirect("/")
  return <>{children}</>
}
