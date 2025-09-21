import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Address } from './types'
import { createAddress, deleteAddress, listAddresses, searchAddresses, updateAddress } from './api'
import { ContactForm } from './ContactForm'
import { EnvelopePreview } from './EnvelopePreview'

export const ContactsListPage: React.FC = () => {
  const [data, setData] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterLabel, setFilterLabel] = useState<boolean | 'any'>('any')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAddressId, setPreviewAddressId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (search.trim() || filterLabel !== 'any') {
        const items = await searchAddresses({ q: search.trim() || undefined, label_marked: filterLabel === 'any' ? undefined : Boolean(filterLabel), limit, offset })
        setData(items)
      } else {
        const items = await listAddresses(limit, offset)
        setData(items)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Błąd pobierania')
    } finally {
      setLoading(false)
    }
  }, [search, filterLabel, limit, offset])

  useEffect(() => { refresh() }, [refresh])

  const onAddClick = useCallback(() => {
    setEditing(null)
    setDialogOpen(true)
  }, [])

  const onEditClick = useCallback((row: Address) => {
    setEditing(row)
    setDialogOpen(true)
  }, [])

  const onSaved = useCallback((saved: Address) => {
    setData(prev => {
      const exists = prev.some(a => a.id === saved.id)
      return exists ? prev.map(a => (a.id === saved.id ? saved : a)) : [saved, ...prev]
    })
  }, [])

  const onEnvelopeClick = useCallback((row: Address) => {
    setPreviewAddressId(row.id)
    setPreviewOpen(true)
  }, [])

  const onDelete = useCallback(async (row: Address) => {
    if (!confirm(`Usunąć kontakt ${row.first_name} ${row.last_name}?`)) return
    try {
      await deleteAddress(row.id)
      setData(prev => prev.filter(a => a.id !== row.id))
    } catch (err: any) {
      alert(err?.message ?? 'Błąd usuwania')
    }
  }, [])

  const canPrev = offset > 0
  const canNext = data.length === limit

  const goPrev = useCallback(() => { if (canPrev) setOffset(o => Math.max(0, o - limit)) }, [canPrev, limit])
  const goNext = useCallback(() => { if (canNext) setOffset(o => o + limit) }, [canNext, limit])

  return (
    <div className="content">
      <div className="page-header">
        <h2>Kontakty</h2>
        <button className="btn primary" onClick={onAddClick}>Dodaj kontakt</button>
      </div>
      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input className="input" placeholder="Szukaj (imię, nazwisko, adres)" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={filterLabel === true} onChange={e => { setFilterLabel(e.target.checked ? true : 'any'); setOffset(0) }} />
          <span>Tylko oznaczone etykietą</span>
        </label>
        <button className="btn" onClick={refresh} disabled={loading}>Odśwież</button>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={goPrev} disabled={!canPrev}>«</button>
          <span>offset {offset}</span>
          <button className="btn" onClick={goNext} disabled={!canNext}>»</button>
        </div>
      </div>
      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imię</th>
              <th>Nazwisko</th>
              <th>Ulica</th>
              <th>Nr m.</th>
              <th>Miasto</th>
              <th>Kod</th>
              <th>Etykieta</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>Ładowanie…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9}>Brak danych</td></tr>
            ) : (
              data.map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.first_name}</td>
                  <td>{row.last_name}</td>
                  <td>{row.street}</td>
                  <td>{row.apartment_no ?? ''}</td>
                  <td>{row.city}</td>
                  <td>{row.postal_code}</td>
                  <td>{row.label_marked ? 'tak' : ''}</td>
                  <td>
                    <button className="btn" onClick={() => onEditClick(row)}>Edytuj</button>
                  <button className="btn" onClick={() => onEnvelopeClick(row)}>Koperta</button>
                    <button className="btn danger" onClick={() => onDelete(row)}>Usuń</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContactForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSaved={onSaved}
      />

      <EnvelopePreview
        open={previewOpen}
        addressId={previewAddressId}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}


