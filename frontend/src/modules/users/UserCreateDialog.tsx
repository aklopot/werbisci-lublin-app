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
    <div className="dialog-backdrop" role="dialog" aria-modal="true" style={{ alignItems: 'center', padding: '16px' }}>
      <div className="dialog" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        <div className="dialog-header" style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{editing ? 'Edycja użytkownika' : 'Nowy użytkownik'}</h3>
        </div>
        <form onSubmit={submit} className="dialog-body" style={{ display: 'grid', gap: 10, padding: '16px', overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Imię i nazwisko</span>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={{ padding: '8px 10px', fontSize: '14px' }} />
          </label>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Login</span>
            <input value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} required minLength={3} style={{ padding: '8px 10px', fontSize: '14px' }} />
          </label>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Email</span>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ padding: '8px 10px', fontSize: '14px' }} />
          </label>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Hasło {editing && '(pozostaw puste aby nie zmieniać)'}</span>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => setForm({ ...form, password: e.target.value })} 
              required={!editing}
              minLength={8}
              style={{ padding: '8px 10px', fontSize: '14px' }}
            />
          </label>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Rola</span>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} style={{ padding: '8px 10px', fontSize: '14px' }}>
              <option value="user">user</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {error && <div className="error" style={{ fontSize: '13px', marginBottom: 0 }}>{error}</div>}
          <div className="dialog-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)', margin: '0 -16px -16px -16px', flexShrink: 0 }}>
            <button type="button" className="btn" onClick={handleClose} disabled={loading} style={{ padding: '8px 14px', fontSize: '14px', minHeight: 'unset' }}>Anuluj</button>
            <button type="submit" className="btn primary" disabled={loading} style={{ padding: '8px 14px', fontSize: '14px', minHeight: 'unset' }}>Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  )
}


