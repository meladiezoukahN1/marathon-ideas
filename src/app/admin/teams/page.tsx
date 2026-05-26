"use client"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Modal } from "@/components/ui/Modal"
import { TeamForm } from "@/components/admin/TeamForm"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { TeamAvatar } from "@/components/common/team-avatar"
import type { ChallengePublic, TeamPublic } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export default function TeamsPage() {
  const [challenges, setChallenges] = useState<ChallengePublic[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal] = useState<{
    open: boolean; challengeId: string; slot: "TEAM1"|"TEAM2"; team?: TeamPublic & { id: string }
  }>({ open: false, challengeId: "", slot: "TEAM1" })

  function load() {
    fetch(`/api/challenges?eventId=${EVENT_ID}`)
      .then(r => r.json())
      .then(j => { if (j.data) setChallenges(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function deleteTeam(teamId: string) {
    if (!confirm("حذف هذا الفريق؟")) return
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })
    const j   = await res.json()
    if (j.error) toast.error(j.error)
    else { toast.success("تم الحذف"); load() }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">الفرق</h1>

      {loading && <><CardSkeleton /><CardSkeleton /></>}

      <div className="space-y-6">
        {challenges.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">{c.order}. {c.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["TEAM1","TEAM2"] as const).map(slot => {
                const team = slot === "TEAM1" ? c.team1 : c.team2
                return (
                  <div key={slot} className={`rounded-xl border-2 p-4 ${team ? "border-gray-200" : "border-dashed border-gray-300"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <Badge label={slot === "TEAM1" ? "الفريق الأول" : "الفريق الثاني"} variant={slot === "TEAM1" ? "info" : "success"} />
                      <div className="flex gap-2">
                        {team ? (
                          <>
                            <Button size="sm" variant="secondary"
                              onClick={() => setModal({ open: true, challengeId: c.id, slot, team: team as TeamPublic & { id: string } })}>
                              تعديل
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => deleteTeam((team as TeamPublic & { id: string }).id)}>
                              حذف
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => setModal({ open: true, challengeId: c.id, slot })}>
                            + إضافة
                          </Button>
                        )}
                      </div>
                    </div>
                    {team ? (
                      <div className="flex items-start gap-3">
                        <TeamAvatar name={team.name} imageUrl={team.imageUrl} size="md" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{team.name}</p>
                          <p className="text-gray-500 text-sm mt-1 leading-relaxed">{team.idea}</p>
                          {team.members && <p className="text-gray-400 text-xs mt-2">👥 {team.members}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">لم يُضَف فريق بعد</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.team ? "تعديل الفريق" : "إضافة فريق"}>
        <TeamForm
          challengeId={modal.challengeId}
          slot={modal.slot}
          initial={modal.team}
          onSaved={() => { setModal(p => ({ ...p, open: false })); load(); toast.success("تم الحفظ") }}
          onCancel={() => setModal(p => ({ ...p, open: false }))}
        />
      </Modal>
    </div>
  )
}
