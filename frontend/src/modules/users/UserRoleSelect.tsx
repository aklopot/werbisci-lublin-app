import React, { useCallback, useState } from 'react'
import type { User, UserRole } from './types'
import { updateUserRole } from './api'

interface Props {
  user: User
  onChanged?: (updated: User) => void
}

export const UserRoleSelect: React.FC<Props> = ({ user, onChanged }) => {
  const [value, setValue] = useState<UserRole>(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value as UserRole
    setValue(nextRole)
    setLoading(true)
    setError(null)
    try {
      const updated = await updateUserRole(user.id, { role: nextRole })
      onChanged?.(updated)
    } catch (err: any) {
      setError(err?.message ?? 'Błąd zmiany roli')
      setValue(user.role)
    } finally {
      setLoading(false)
    }
  }, [user.id, user.role, onChanged])

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <select value={value} onChange={onChange} disabled={loading}>
        <option value="user">user</option>
        <option value="manager">manager</option>
        <option value="admin">admin</option>
      </select>
      {loading && <span style={{ fontSize: 12, color: '#666' }}>zapisywanie…</span>}
      {error && <span style={{ fontSize: 12, color: 'crimson' }}>{error}</span>}
    </div>
  )
}


