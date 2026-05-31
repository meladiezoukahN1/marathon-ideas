"use client"
import React, { useState, useCallback } from "react"
import { TeamAvatar } from "@/components/common/team-avatar"
import type { TeamPublic } from "@/types/domain.types"

export function TeamForm({
  challengeId,
  slot,
  initial,
  onSaved,
  onCancel,
}: {
  challengeId: string
  slot: "TEAM1" | "TEAM2"
  initial?: TeamPublic & { id: string }
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName]         = useState(initial?.name ?? "")
  const [idea, setIdea]         = useState(initial?.idea ?? "")
  const [members, setMembers]   = useState(initial?.members ?? "")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [imageDeleted, setImageDeleted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState("")

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload/image", { method: "POST", body: formData })
      const json = await res.json()
      if (json.data?.url) {
        setImageUrl(json.data.url)
        setImageDeleted(false)
      } else {
        setError(json.error || "فشل رفع الصورة")
      }
    } catch {
      setError("فشل رفع الصورة")
    }
    setUploading(false)
  }, [])

  async function handleSubmit() {
    if (!name.trim() || !idea.trim()) {
      setError("الاسم والفكرة مطلوبان")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload: Record<string, unknown> = { name, idea }
      if (members) payload.members = members

      if (imageDeleted) {
        payload.imageUrl = null
      } else if (imageUrl && imageUrl !== initial?.imageUrl) {
        payload.imageUrl = imageUrl
      }

      if (initial) {
        const res = await fetch(`/api/teams/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
      } else {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, challengeId, slot }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4 min-w-[300px]">
      <div className="flex flex-col items-center gap-2">
        <TeamAvatar name={name || "?"} imageUrl={imageUrl} size="lg" />
        <label className="cursor-pointer">
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} />
          <span className="text-sm text-blue-600 hover:underline">
            {uploading ? "جاري الرفع..." : imageUrl ? "تغيير الصورة" : "إضافة صورة"}
          </span>
        </label>
        {imageUrl && (
          <button onClick={() => { setImageUrl(""); setImageDeleted(true); }} className="text-xs text-red-500 hover:underline">حذف الصورة</button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفريق</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="اسم الفريق"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الفكرة</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm min-h-[80px]"
            placeholder="وصف الفكرة"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الأعضاء</label>
          <input
            type="text"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="أسماء الأعضاء (اختياري)"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || uploading}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
        >
          {saving ? "جاري الحفظ..." : initial ? "حفظ التعديلات" : "إضافة الفريق"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}
