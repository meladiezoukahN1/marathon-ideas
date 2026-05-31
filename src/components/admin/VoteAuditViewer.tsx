"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChallengePublic } from "@/types/domain.types"
import type { VoteAuditEntry, PaginationMeta } from "@/server/modules/matches/types"

interface Props {
  challenge: ChallengePublic
}

type VoteTypeFilter = "" | "PUBLIC" | "JURY" | "ALL"

export function VoteAuditViewer({ challenge }: Props) {
  const [entries, setEntries] = useState<VoteAuditEntry[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [teamFilter, setTeamFilter] = useState("")
  const [voteTypeFilter, setVoteTypeFilter] = useState<VoteTypeFilter>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))
      if (teamFilter) params.set("teamId", teamFilter)
      if (voteTypeFilter) params.set("voteType", voteTypeFilter)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())

      const res = await fetch(`/api/admin/matches/${challenge.id}/votes?${params}`)
      const json = await res.json()
      if (json.data) {
        setEntries(json.data)
        setPagination(json.pagination)
      } else {
        setEntries([])
        setPagination(null)
      }
    } catch {
      setEntries([])
      setPagination(null)
    }
    setLoading(false)
  }, [challenge.id, page, pageSize, teamFilter, voteTypeFilter, searchQuery])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchAudit()
    }, 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
    fetchAudit()
  }, [pageSize, teamFilter, voteTypeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAudit()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const teams = [challenge.team1, challenge.team2].filter(Boolean) as NonNullable<ChallengePublic["team1"]>[]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">مراقبة المصوتين</h3>
        <button
          onClick={fetchAudit}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? "جارٍ التحميل..." : "تحديث"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-semibold">الفريق</label>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="">الكل</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-semibold">نوع التصويت</label>
          <select
            value={voteTypeFilter}
            onChange={(e) => setVoteTypeFilter(e.target.value as VoteTypeFilter)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="ALL">الكل</option>
            <option value="PUBLIC">عام</option>
            <option value="JURY">لجنة</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-semibold">بحث</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="اسم المقيم..."
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white w-40"
          />
        </div>
      </div>

      {/* Results info */}
      {pagination && (
        <p className="text-xs text-gray-500">
          عدد النتائج: {pagination.total} (صفحة {pagination.page} من {pagination.totalPages})
        </p>
      )}

      {/* Table */}
      {entries.length === 0 && !loading && (
        <p className="text-center py-8 text-gray-400">لا توجد أصوات</p>
      )}

      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-right">
                <th className="py-2 px-2 text-gray-600 font-semibold">الفريق</th>
                <th className="py-2 px-2 text-gray-600 font-semibold">المصوت</th>
                <th className="py-2 px-2 text-gray-600 font-semibold">نوع التصويت</th>
                <th className="py-2 px-2 text-gray-600 font-semibold">وقت التصويت</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2">{entry.teamName}</td>
                  <td className="py-2 px-2 font-mono text-xs text-gray-600">{entry.voterIdentifier}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${entry.voteType === "PUBLIC" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {entry.voteType === "PUBLIC" ? "عام" : "لجنة"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString("ar-SA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">عدد النتائج:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 rounded border border-gray-300 text-sm bg-white"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-40 transition"
            >
              السابق
            </button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-40 transition"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
