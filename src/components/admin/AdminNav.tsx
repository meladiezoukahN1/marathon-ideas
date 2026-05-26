"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"

const LINKS = [
  { href: "/admin",            label: "لوحة التحكم" },
  { href: "/admin/challenges", label: "التحديات"    },
  { href: "/admin/teams",      label: "الفرق"       },
  { href: "/admin/users",      label: "المستخدمون" },
]

interface Props { role: string; username: string }

export function AdminNav({ role, username }: Props) {
  void role
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-1 overflow-x-auto">
        <span className="text-lg font-black text-gray-900 ml-4 flex-shrink-0">🏆 Marathon</span>
        {LINKS.map(l => {
          const isActive = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {l.label}
            </Link>
          )
        })}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm text-gray-500 hidden md:block">{username}</span>
        <Button size="sm" variant="danger" onClick={() => signOut({ callbackUrl: "/login" })}>خروج</Button>
      </div>
    </nav>
  )
}
