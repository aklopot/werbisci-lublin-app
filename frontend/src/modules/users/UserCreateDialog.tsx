import React, { useCallback, useState } from 'react'
import { createUser } from './api'
import type { User, UserCreateInput, UserRole } from './types'

interface Props {
  onCreated?: (user: User) => void
}

export const UserCreateDialog: React.FC<Props> = ({ onCreated }) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserCreateInput>({
    full_name: '',
    login: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setForm({ full_name: '', login: '', email: '', password: '', role: 'user' })
    setError(null)
  }

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const created = await createUser(form)
      onCreated?.(created)
      setOpen(false)
      reset()
    } catch (err: any) {
      setError(err?.message ?? 'Błąd tworzenia użytkownika')
    } finally {
      setLoading(false)
    }
  }, [form, onCreated])

  if (!open) {
    return <button className="btn primary" onClick={() => setOpen(true)}>Dodaj użytkownika</button>
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog-header">
          <h3 style={{ margin: 0 }}>Nowy użytkownik</h3>
        </div>
        <form onSubmit={submit} className="dialog-body" style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span>Imię i nazwisko</span>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </label>
          <label className="field">
            <span>Login</span>
            <input value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} required minLength={3} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="field">
            <span>Hasło</span>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </label>
          <label className="field">
            <span>Rola</span>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="user">user</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <div className="dialog-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => { setOpen(false); reset() }} disabled={loading}>Anuluj</button>
            <button type="submit" className="btn primary" disabled={loading}>Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  )
}


