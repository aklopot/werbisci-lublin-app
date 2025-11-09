import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Address, AddressCreateInput, AddressUpdateInput } from './types'
import { createAddress, updateAddress } from './api'

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: (address: Address) => void
  editing?: Address | null
}

function validatePostalCode(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  // Accept common formats like "12-345" or alphanumerics
  return /^[0-9A-Za-z\-\s]{3,20}$/.test(v)
}

export const ContactForm: React.FC<Props> = ({ open, onClose, onSaved, editing }) => {
  const [form, setForm] = useState<AddressCreateInput>({
    first_name: '',
    last_name: '',
    street: '',
    apartment_no: '',
    city: '',
    postal_code: '',
    description: '',
  })
  const [labelMarked, setLabelMarked] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep inputs consistent height with default theme; ensure they can shrink within grid
  const fullWidthInputStyle: React.CSSProperties = useMemo(() => ({ width: '100%', minWidth: 0, boxSizing: 'border-box' }), [])

  useEffect(() => {
    if (editing) {
      setForm({
        first_name: editing.first_name,
        last_name: editing.last_name,
        street: editing.street,
        apartment_no: editing.apartment_no ?? '',
        city: editing.city,
        postal_code: editing.postal_code,
        description: editing.description ?? '',
      })
      setLabelMarked(editing.label_marked)
    } else {
      setForm({ first_name: '', last_name: '', street: '', apartment_no: '', city: '', postal_code: '', description: '' })
      setLabelMarked(false)
    }
  }, [editing])

  const isValid = useMemo(() => {
    return (
      form.first_name.trim().length > 0 &&
      form.last_name.trim().length > 0 &&
      form.street.trim().length > 0 &&
      form.city.trim().length > 0 &&
      validatePostalCode(form.postal_code)
    )
  }, [form])

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      if (editing) {
        const payload: AddressUpdateInput = {
          first_name: form.first_name,
          last_name: form.last_name,
          street: form.street,
          apartment_no: form.apartment_no?.trim() || null,
          city: form.city,
          postal_code: form.postal_code,
          description: form.description?.trim() || null,
          label_marked: labelMarked,
        }
        const saved = await updateAddress(editing.id, payload)
        onSaved?.(saved)
      } else {
        const payload: AddressCreateInput = {
          first_name: form.first_name,
          last_name: form.last_name,
          street: form.street,
          apartment_no: form.apartment_no?.trim() || undefined,
          city: form.city,
          postal_code: form.postal_code,
          description: form.description?.trim() || null,
        }
        const created = await createAddress(payload)
        // If label_marked requested on create, do a follow-up update since backend create doesn't accept label_marked
        const maybeUpdated = labelMarked ? await updateAddress(created.id, { label_marked: true }) : created
        onSaved?.(maybeUpdated)
      }
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Błąd zapisu')
    } finally {
      setLoading(false)
    }
  }, [editing, form, labelMarked, isValid, onClose, onSaved])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" style={{ alignItems: 'center', padding: '16px' }}>
      <div className="dialog" style={{ maxWidth: 640, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        <div className="dialog-header" style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{editing ? 'Edycja kontaktu' : 'Nowy kontakt'}</h3>
        </div>
        <form onSubmit={submit} className="dialog-body" style={{ display: 'grid', gap: 10, padding: '16px', overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="field" style={{ margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Imię</span>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </label>
            <label className="field" style={{ margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Nazwisko</span>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) 120px', gap: 10 }}>
            <label className="field" style={{ gridColumn: '1 / span 2', minWidth: 0, margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Ulica</span>
              <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required style={{ ...fullWidthInputStyle }} />
            </label>
            <label className="field" style={{ gridColumn: '3', minWidth: 0, margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Nr mieszkania</span>
              <input value={form.apartment_no ?? ''} onChange={e => setForm({ ...form, apartment_no: e.target.value })} style={{ ...fullWidthInputStyle }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) 120px', gap: 10 }}>
            <label className="field" style={{ gridColumn: '1', minWidth: 0, margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Kod pocztowy</span>
              <input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} required style={{ ...fullWidthInputStyle }} />
            </label>
            <label className="field" style={{ gridColumn: '2 / span 2', minWidth: 0, margin: 0, gap: 4 }}>
              <span style={{ fontSize: '14px' }}>Miasto</span>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required style={{ ...fullWidthInputStyle }} />
            </label>
          </div>
          <label className="field" style={{ margin: 0, gap: 4 }}>
            <span style={{ fontSize: '14px' }}>Opis</span>
            <textarea 
              value={form.description ?? ''} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              style={{ resize: 'vertical', minHeight: '50px' }}
              placeholder="Dodatkowe informacje o kontakcie..."
            />
          </label>
          <label className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <input type="checkbox" checked={labelMarked} onChange={e => setLabelMarked(e.target.checked)} />
            <span style={{ fontSize: '14px' }}>Zaznaczony do etykiety</span>
          </label>
          {error && <div className="error" style={{ fontSize: '13px', marginBottom: 0 }}>{error}</div>}
          <div className="dialog-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)', margin: '0 -16px -16px -16px', flexShrink: 0 }}>
            <button type="button" className="btn" onClick={onClose} disabled={loading} style={{ padding: '8px 14px', fontSize: '14px', minHeight: 'unset' }}>Anuluj</button>
            <button type="submit" className="btn primary" disabled={loading || !isValid} style={{ padding: '8px 14px', fontSize: '14px', minHeight: 'unset' }}>{editing ? 'Zapisz' : 'Dodaj'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


