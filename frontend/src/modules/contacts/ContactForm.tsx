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
      })
      setLabelMarked(editing.label_marked)
    } else {
      setForm({ first_name: '', last_name: '', street: '', apartment_no: '', city: '', postal_code: '' })
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
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog" style={{ maxWidth: 640 }}>
        <div className="dialog-header">
          <h3 style={{ margin: 0 }}>{editing ? 'Edycja kontaktu' : 'Nowy kontakt'}</h3>
        </div>
        <form onSubmit={submit} className="dialog-body" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Imię</span>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Nazwisko</span>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) 120px', gap: 12 }}>
            <label className="field" style={{ gridColumn: '1 / span 2', minWidth: 0 }}>
              <span>Ulica</span>
              <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required style={fullWidthInputStyle} />
            </label>
            <label className="field" style={{ gridColumn: '3', minWidth: 0 }}>
              <span>Nr mieszkania</span>
              <input value={form.apartment_no ?? ''} onChange={e => setForm({ ...form, apartment_no: e.target.value })} style={fullWidthInputStyle} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) 120px', gap: 12 }}>
            <label className="field" style={{ gridColumn: '1', minWidth: 0 }}>
              <span>Kod pocztowy</span>
              <input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} required style={fullWidthInputStyle} />
            </label>
            <label className="field" style={{ gridColumn: '2 / span 2', minWidth: 0 }}>
              <span>Miasto</span>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required style={fullWidthInputStyle} />
            </label>
          </div>
          <label className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={labelMarked} onChange={e => setLabelMarked(e.target.checked)} />
            <span>Zaznaczony do etykiety</span>
          </label>
          {error && <div className="error">{error}</div>}
          <div className="dialog-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose} disabled={loading}>Anuluj</button>
            <button type="submit" className="btn primary" disabled={loading || !isValid}>{editing ? 'Zapisz' : 'Dodaj'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


