"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Badge } from "@/components/ui/Badge"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { getChallengePhaseLabel } from "@/lib/labels"
import type { ChallengePublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"


export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengePublic[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<ChallengePublic | null>(null)
  const [form, setForm] = useState({ name: "", description: "", slug: "", order: 1 })
  const [saving, setSaving] = useState(false)

  // Confirmation modals
  const [confirmResetAll, setConfirmResetAll] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deleteAllText, setDeleteAllText] = useState("")

  function load() {
    fetch(`/api/challenges?eventId=${EVENT_ID}`)
      .then(r => r.json())
      .then(j => { if (j.data) setChallenges(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  function openCreate() {
    setForm({ name: "", description: "", slug: "", order: (challenges.length + 1) })
    setEditTarget(null); setShowCreate(true)
  }
  function openEdit(c: ChallengePublic) {
    setForm({ name: c.name, description: c.description ?? "", slug: c.slug, order: c.order })
    setEditTarget(c); setShowCreate(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (editTarget) {
        const res  = await fetch(`/api/challenges/${editTarget.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, description: form.description }),
        })
        const json = await res.json()
        if (json.error) { toast.error(json.error); return }
        toast.success("تم تعديل التحدي")
      } else {
        const res  = await fetch("/api/challenges", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, eventId: EVENT_ID }),
        })
        const json = await res.json()
        if (json.error) { toast.error(json.error === "SLUG_TAKEN" ? "الرمز مستخدم مسبقاً" : json.error); return }
        toast.success("تم إنشاء التحدي")
      }
      setShowCreate(false); load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ")
    } finally { setSaving(false) }
  }

  async function deleteChallenge(id: string) {
    if (!confirm("هل تريد حذف هذا التحدي؟\n\nملاحظة: لا يمكن حذف التحدي إذا كان يحتوي على فرق أو أصوات. استخدم إعادة الضبط أولاً.")) return
    const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" })
    const j   = await res.json()
    if (j.error) {
      if (j.error.includes("CHALLENGE_HAS_TEAMS")) toast.error("لا يمكن الحذف: التحدي يحتوي على فرق. قم بحذف الفرق أولاً أو استخدم إعادة الضبط.")
      else if (j.error.includes("CHALLENGE_HAS_VOTES")) toast.error("لا يمكن الحذف: التحدي يحتوي على أصوات. قم بإعادة الضبط أولاً.")
      else toast.error(j.error)
    }
    else { toast.success("تم الحذف"); load() }
  }

  async function resetChallenge(id: string) {
    if (!confirm("⚠️ هل أنت متأكد من إعادة ضبط هذا التحدي؟\n\nسيتم:\n• حذف جميع الأصوات\n• إعادة المؤقتات\n• مسح النتيجة والفائز\n• العودة لمرحلة الانتظار")) return
    const res = await fetch(`/api/admin/matches/${id}/reset`, { method: "POST" })
    const j   = await res.json()
    if (j.error) toast.error(j.error)
    else { toast.success("تم إعادة ضبط التحدي"); load() }
  }

  async function startChallenge(id: string) {
    try {
      const r1 = await fetch(`/api/admin/matches/${id}/activate`, { method: "POST" })
      const j1 = await r1.json()
      if (j1.error) throw new Error(j1.error)
      const r2 = await fetch(`/api/admin/matches/${id}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "PRESENTING" }),
      })
      const j2 = await r2.json()
      if (j2.error) throw new Error(j2.error)
      toast.success("تم بدء التحدي")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل بدء التحدي")
    }
  }

  async function finishChallenge(id: string) {
    try {
      const res = await fetch(`/api/admin/matches/${id}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "FINISHED" }),
      })
      const j = await res.json()
      if (j.error) throw new Error(j.error)
      toast.success("تم إنهاء التحدي")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل إنهاء التحدي")
    }
  }

  async function resetAll() {
    const res = await fetch("/api/admin/matches/reset-all", { method: "POST" })
    const j = await res.json()
    if (j.error) { toast.error(j.error); return }
    toast.success(`تم إعادة ضبط ${j.data?.count ?? 0} تحدٍ`)
    setConfirmResetAll(false)
    load()
  }

  async function deleteAll() {
    const res = await fetch("/api/admin/matches", { method: "DELETE" })
    const j = await res.json()
    if (j.error) { toast.error(j.error); return }
    toast.success(`تم حذف ${j.data?.count ?? 0} تحدٍ`)
    setConfirmDeleteAll(false)
    setDeleteAllText("")
    load()
  }

  const PHASE_BADGE: Record<string, "neutral"|"info"|"success"|"warning"> = {
    WAITING:"neutral", PRESENTING:"info", VOTING:"success", RESULT:"warning", FINISHED:"neutral",
  }

  const isActivePhase = (phase: string) => phase === "PRESENTING" || phase === "VOTING" || phase === "RESULT"

  function getPhaseAction(c: ChallengePublic) {
    switch (c.phase) {
      case "WAITING":
        return (
          <Button size="sm" onClick={() => startChallenge(c.id)} disabled={challenges.some(x => isActivePhase(x.phase) && x.id !== c.id)}>
            بدء هذا التحدي
          </Button>
        )
      case "PRESENTING":
        return <span className="text-sm font-semibold text-blue-600">قيد العرض الآن</span>
      case "VOTING":
        return <span className="text-sm font-semibold text-emerald-600">التصويت مفتوح الآن</span>
      case "RESULT":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => window.open(`/display?challenge=${c.id}`, "_blank")}>عرض النتيجة</Button>
            <Button size="sm" variant="warning" onClick={() => finishChallenge(c.id)}>إنهاء التحدي</Button>
          </div>
        )
      case "FINISHED":
        return <span className="text-sm font-semibold text-gray-500">منتهي</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-gray-900">التحديات</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="danger" onClick={() => setConfirmDeleteAll(true)}>حذف كل التحديات نهائياً</Button>
          <Button variant="warning" onClick={() => setConfirmResetAll(true)}>إعادة ضبط كل التحديات</Button>
          <Button onClick={openCreate}>+ إنشاء تحدٍّ</Button>
        </div>
      </div>

      {loading && <><CardSkeleton /><CardSkeleton /><CardSkeleton /></>}

      <div className="grid gap-4">
        {challenges.map(c => (
          <div key={c.id} className={`bg-white border rounded-2xl p-5 ${isActivePhase(c.phase) ? "border-yellow-300 ring-1 ring-yellow-200" : "border-gray-200"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-gray-400 font-bold">#{c.order}</span>
                  <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                  <Badge label={c.slug} variant="neutral" />
                  <Badge label={getChallengePhaseLabel(c.phase)} variant={PHASE_BADGE[c.phase]} />
                  {isActivePhase(c.phase) && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">قيد التنفيذ</span>
                  )}
                </div>
                {c.description && <p className="text-gray-500 text-sm">{c.description}</p>}
                <div className="flex gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                  <span>الفريق 1: <strong className="text-gray-700">{c.team1?.name ?? "—"}</strong></span>
                  <span>الفريق 2: <strong className="text-gray-700">{c.team2?.name ?? "—"}</strong></span>
                  {c.winnerId && (
                    <span className="text-emerald-600 font-bold">
                      🏆 {c.team1?.id === c.winnerId ? c.team1.name : c.team2?.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {getPhaseAction(c)}
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>تعديل</Button>
                  <Button size="sm" variant="warning" onClick={() => resetChallenge(c.id)}>إعادة ضبط هذا التحدي</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteChallenge(c.id)}>حذف</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && challenges.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200">
            <div className="text-4xl mb-3">📋</div>
            <p>لا توجد تحديات بعد</p>
            <Button className="mt-4" onClick={openCreate}>إنشاء أول تحدٍّ</Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}
        title={editTarget ? "تعديل التحدي" : "إنشاء تحدٍّ جديد"}>
        <div className="space-y-4">
          <Input label="اسم التحدي *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: الزراعة والأمن الغذائي" />
          <Textarea label="الوصف" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للتحدي..." rows={2} />
          {!editTarget && <>
            <Input label="الرمز (slug) *" value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g,"-") }))}
              placeholder="agriculture-food" />
            <Input label="الترتيب *" type="number" value={form.order}
              onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 1 }))} />
          </>}
          <div className="flex gap-2 pt-2">
            <Button onClick={save} loading={saving} className="flex-1">{editTarget ? "حفظ التعديل" : "إنشاء"}</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* Reset All Modal */}
      <Modal open={confirmResetAll} onClose={() => setConfirmResetAll(false)} title="إعادة ضبط كل التحديات">
        <div className="space-y-4">
          <p className="text-gray-700">
            هل أنت متأكد من إعادة ضبط كل التحديات؟ سيتم حذف الأصوات والنتائج وإعادة العدادات من البداية. لن يتم حذف الفرق.
          </p>
          <div className="flex gap-2">
            <Button variant="warning" className="flex-1" onClick={resetAll}>تأكيد إعادة الضبط</Button>
            <Button variant="secondary" onClick={() => setConfirmResetAll(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* Delete All Modal */}
      <Modal open={confirmDeleteAll} onClose={() => { setConfirmDeleteAll(false); setDeleteAllText("") }} title="حذف كل التحديات نهائياً">
        <div className="space-y-4">
          <p className="text-gray-700">
            هل أنت متأكد من حذف كل التحديات نهائياً؟ سيتم حذف جميع النزالات والأصوات والنتائج والفائزين. لن يتم حذف الفرق.
          </p>
          <p className="text-sm text-gray-500">
            اكتب <strong className="text-red-600">حذف كل التحديات</strong> للتأكيد:
          </p>
          <Input
            value={deleteAllText}
            onChange={e => setDeleteAllText(e.target.value)}
            placeholder="حذف كل التحديات"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              disabled={deleteAllText !== "حذف كل التحديات"}
              onClick={deleteAll}
            >
              تأكيد الحذف النهائي
            </Button>
            <Button variant="secondary" onClick={() => { setConfirmDeleteAll(false); setDeleteAllText("") }}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
