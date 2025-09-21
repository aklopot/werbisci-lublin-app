import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteUser, listUsers } from './api'
import type { User } from './types'
import { UserRoleSelect } from './UserRoleSelect'
import { UserCreateDialog } from './UserCreateDialog'
import { useAuth } from '../../app/auth'
import { Navigate } from 'react-router-dom'

export const UsersListPage: React.FC = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const onDelete = useCallback(async (user: User) => {
    if (!confirm(`Usunąć użytkownika ${user.full_name}?`)) return
    try {
      await deleteUser(user.id)
      setData(prev => prev.filter(u => u.id !== user.id))
    } catch (err: any) {
      alert(err?.message ?? 'Błąd usuwania')
    }
  }, [])

  const onRoleChanged = useCallback((updated: User) => {
    setData(prev => prev.map(u => (u.id === updated.id ? updated : u)))
  }, [])

  const onCreated = useCallback((created: User) => {
    setData(prev => [...prev, created])
  }, [])

  if (!isAdmin) {
    return <Navigate to="/app/contacts" replace />
  }

  return (
    <div className="content">
      <div className="page-header">
        <h2>Użytkownicy</h2>
        <UserCreateDialog onCreated={onCreated} />
      </div>
      <div className="toolbar">
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
                  <td>
                    <UserRoleSelect user={user} onChanged={onRoleChanged} />
                  </td>
                  <td>
                    <button className="btn danger" onClick={() => onDelete(user)}>Usuń</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


