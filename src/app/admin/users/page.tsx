"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { UserManager } from "@/components/admin/UserManager"
import { CardSkeleton } from "@/components/ui/Skeleton"
import type { UserPublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    fetch(`/api/users?eventId=${EVENT_ID}`)
      .then(r => r.json())
      .then(j => { if (j.data) setUsers(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  if (session?.user.role !== "SUPERADMIN") {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-4xl mb-3">🔒</div>
        <p>هذه الصفحة للسوبر أدمن فقط</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900">إدارة المستخدمين</h1>
      {loading ? <CardSkeleton /> : (
        <UserManager users={users} eventId={EVENT_ID} onRefresh={load} />
      )}
    </div>
  )
}
