import React, { useCallback, useEffect, useState } from 'react'
import { createUser, updateUser } from './api'
import type { User, UserCreateInput, UserRole } from './types'

interface Props {
  onCreated?: (user: User) => void
  onUpdated?: (user: User) => void
  editing?: User | null
  open?: boolean
  onClose?: () => void
}

export const UserCreateDialog: React.FC<Props> = ({ onCreated, onUpdated, editing, open: controlledOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : internalOpen

  const [form, setForm] = useState<UserCreateInput>({
    full_name: '',
    login: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when editing
  useEffect(() => {
    if (editing) {
      setForm({
        full_name: editing.full_name,
        login: editing.login,
        email: editing.email,
        password: '',
        role: editing.role,
      })
      setError(null)
    } else {
      reset()
    }
  }, [editing])

  const reset = () => {
    setForm({ full_name: '', login: '', email: '', password: '', role: 'user' })
    setError(null)
  }

  const handleClose = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
    if (!editing) {
      reset()
    }
  }

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editing) {
        // Update existing user
        const payload: any = {
          full_name: form.full_name,
          login: form.login,
          email: form.email,
          role: form.role,
        }
        // Only include password if it was changed
        if (form.password) {
          payload.password = form.password
        }
        const updated = await updateUser(editing.id, payload)
        onUpdated?.(updated)
      } else {
        // Create new user
        const created = await createUser(form)
        onCreated?.(created)
      }
      handleClose()
    } catch (err: any) {
      setError(err?.message ?? (editing ? 'Błąd aktualizacji użytkownika' : 'Błąd tworzenia użytkownika'))
    } finally {
      setLoading(false)
    }
  }, [form, editing, onCreated, onUpdated])

  // If not controlled, render the trigger button when closed
  if (!isControlled && !open) {
    return <button className="btn primary" onClick={() => setInternalOpen(true)}>Dodaj użytkownika</button>
  }

  // Don't render dialog if controlled and closed
  if (isControlled && !open) {
    return null
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog-header">
          <h3 style={{ margin: 0 }}>{editing ? 'Edycja użytkownika' : 'Nowy użytkownik'}</h3>
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
            <span>Hasło {editing && '(pozostaw puste aby nie zmieniać)'}</span>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => setForm({ ...form, password: e.target.value })} 
              required={!editing}
              minLength={8} 
            />
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
            <button type="button" className="btn" onClick={handleClose} disabled={loading}>Anuluj</button>
            <button type="submit" className="btn primary" disabled={loading}>Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  )
}


