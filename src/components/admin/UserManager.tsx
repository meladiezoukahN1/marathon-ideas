import React from "react"
import type { UserPublic } from "@/types/domain.types"

export function UserManager({
  users,
  eventId,
  onRefresh,
}: {
  users: UserPublic[]
  eventId: string
  onRefresh: () => void
}) {
  void eventId
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <h3 className="font-bold text-gray-900">إدارة المستخدمين</h3>
      <p className="text-sm text-gray-600">عدد المستخدمين: {users.length}</p>
      <button onClick={onRefresh} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">تحديث</button>
    </div>
  )
}
