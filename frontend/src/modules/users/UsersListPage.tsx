import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteUser, listUsers } from './api'
import type { User } from './types'
import { UserCreateDialog } from './UserCreateDialog'
import { useAuth } from '../../app/auth'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '../../app/ui/PageHeader'

export const UsersListPage: React.FC = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const users = await listUsers()
      setData(users)
    } catch (err: any) {
      setError(err?.message ?? 'Błąd pobierania')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [data, search])

  const onEditClick = useCallback((user: User) => {
    setEditing(user)
    setEditDialogOpen(true)
  }, [])

  const onDelete = useCallback(async (user: User) => {
    if (!confirm(`Usunąć użytkownika ${user.full_name}?`)) return
    try {
      await deleteUser(user.id)
      setData(prev => prev.filter(u => u.id !== user.id))
    } catch (err: any) {
      alert(err?.message ?? 'Błąd usuwania')
    }
  }, [])

  const onCreated = useCallback((created: User) => {
    setData(prev => [...prev, created])
  }, [])

  const onUpdated = useCallback((updated: User) => {
    setData(prev => prev.map(u => (u.id === updated.id ? updated : u)))
  }, [])

  if (!isAdmin) {
    return <Navigate to="/app/contacts" replace />
  }

  return (
    <div className="content">
      <PageHeader
        title="Użytkownicy"
        actions={<UserCreateDialog onCreated={onCreated} />}
      />
      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', minHeight: '52px' }}>
        <input className="input" placeholder="Szukaj (imię, login, email)" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn" onClick={refresh} disabled={loading}>Odśwież</button>
      </div>
      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imię i nazwisko</th>
              <th>Login</th>
              <th>Email</th>
              <th>Rola</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Ładowanie…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>Brak danych</td></tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.full_name}</td>
                  <td>{user.login}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn icon"
                      onClick={() => onEditClick(user)}
                      title="Edytuj użytkownika"
                      aria-label="Edytuj użytkownika"
                    >
                      {/* Pencil icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn icon danger"
                      onClick={() => onDelete(user)}
                      style={{ marginLeft: 4 }}
                      title="Usuń użytkownika"
                      aria-label="Usuń użytkownika"
                    >
                      {/* Trash icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserCreateDialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditing(null) }}
        editing={editing}
        onUpdated={onUpdated}
      />
    </div>
  )
}


