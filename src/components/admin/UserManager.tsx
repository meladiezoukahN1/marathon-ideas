"use client"

import { type FormEvent, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import type { UserPublic, UserRole } from "@/types/domain.types"

type UsersResponse = {
  data: UserPublic[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error: string | null
}

type UserFormState = {
  username: string
  password: string
  role: UserRole
}

const EMPTY_FORM: UserFormState = {
  username: "",
  password: "",
  role: "JURY",
}

function roleBadge(role: UserRole) {
  if (role === "SUPERADMIN") return <Badge label="SUPERADMIN" variant="warning" />
  if (role === "ADMIN") return <Badge label="ADMIN" variant="info" />
  return <Badge label="JURY" variant="neutral" />
}

export function UserManager() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" })
        if (search) params.set("search", search)

        const response = await fetch(`/api/admin/users?${params.toString()}`)
        const json = (await response.json()) as UsersResponse

        if (!response.ok) {
          throw new Error(json.error ?? "فشل تحميل المستخدمين")
        }

        if (!cancelled) {
          setUsers(json.data)
          setPagination(json.pagination)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "فشل تحميل المستخدمين")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [page, search])

  function openCreateModal() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(user: UserPublic) {
    setEditingUser(user)
    setForm({
      username: user.username,
      password: "",
      role: user.role,
    })
    setModalOpen(true)
  }

  async function refreshCurrentPage() {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" })
    if (search) params.set("search", search)

    const response = await fetch(`/api/admin/users?${params.toString()}`)
    const json = (await response.json()) as UsersResponse
    if (response.ok) {
      setUsers(json.data)
      setPagination(json.pagination)
    }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    const body: Record<string, unknown> = {
      username: form.username.trim(),
      role: form.role,
    }
    if (form.password.trim()) {
      body.password = form.password.trim()
    }

    try {
      const response = await fetch(editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await response.json()

      if (!response.ok) {
        if (json.error === "USERNAME_TAKEN") {
          toast.error("اسم المستخدم مستخدم مسبقاً")
          return
        }
        if (json.error === "LAST_SUPERADMIN") {
          toast.error("لا يمكن تغيير دور آخر مدير رئيسي")
          return
        }
        throw new Error(json.error ?? "فشل حفظ المستخدم")
      }

      toast.success(editingUser ? "تم تعديل المستخدم" : "تم إنشاء المستخدم")
      setModalOpen(false)
      setEditingUser(null)
      setForm(EMPTY_FORM)
      await refreshCurrentPage()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ المستخدم")
    } finally {
      setSaving(false)
    }
  }

  if (session && session.user.role !== "SUPERADMIN") {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
        هذه الصفحة مخصصة للسوبر أدمن فقط
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">إدارة المستخدمين</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">المستخدمون والصلاحيات</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              إنشاء المستخدمين وتعديل بياناتهم مباشرة من لوحة التحكم.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ابحث باسم المستخدم"
              className="sm:w-80"
            />
            <Button onClick={openCreateModal}>إضافة مستخدم</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-right">
            <thead className="bg-slate-50">
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-4 py-4">اسم المستخدم</th>
                <th className="px-4 py-4">الدور</th>
                <th className="px-4 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={3}>جاري تحميل المستخدمين...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={3}>لا توجد نتائج مطابقة</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{user.username}</div>
                    <div className="text-xs text-slate-500">{user.createdAt}</div>
                  </td>
                  <td className="px-4 py-4">{roleBadge(user.role)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(user)}>تعديل</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            عرض {users.length} من أصل {pagination.total} مستخدم
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            >
              السابق
            </Button>
            <span className="text-sm font-medium text-slate-600">
              صفحة {pagination.page || page} من {pagination.totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.totalPages === 0 || page >= pagination.totalPages}
              onClick={() => setPage((previous) => previous + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "تعديل المستخدم" : "إضافة مستخدم"}
      >
        <form className="space-y-4" onSubmit={saveUser}>
          <Input
            label="اسم المستخدم"
            value={form.username}
            onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
            required
          />

          <div>
            <label htmlFor="user-role" className="mb-1 block text-sm font-medium text-gray-700">الدور</label>
            <select
              id="user-role"
              aria-label="الدور"
              value={form.role}
              onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value as UserRole }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="JURY">JURY</option>
            </select>
          </div>

          <Input
            label={editingUser ? "كلمة المرور الجديدة" : "كلمة المرور"}
            type="password"
            value={form.password}
            onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
            placeholder={editingUser ? "اتركه فارغاً إذا لا تريد تغيير كلمة المرور" : ""}
            required={!editingUser}
          />

          {editingUser && <p className="text-xs text-slate-500">اتركه فارغاً إذا لا تريد تغيير كلمة المرور</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={saving}>{editingUser ? "حفظ التعديلات" : "إنشاء المستخدم"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
