import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Address } from './types'
import { createAddress, deleteAddress, listAddresses, searchAddresses, updateAddress, importAddressesCsv, clearAddressesData, recreateAddressesSchema, type ImportResult, type DatabaseOperationResult } from './api'
import { ContactForm } from './ContactForm'
import { EnvelopePreview } from './EnvelopePreview'
import { LabelsPreview } from './LabelsPreview'
import { useAuth } from '../../app/auth'
import { fetchBlob } from '../../app/api'
import { PageHeader } from '../../app/ui/PageHeader'
import { DropdownMenu } from '../../app/ui/DropdownMenu'

export const ContactsListPage: React.FC = () => {
  const { currentUser, token } = useAuth()
  const [data, setData] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterLabel, setFilterLabel] = useState<'all' | 'with_label' | 'without_label'>('all')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAddressId, setPreviewAddressId] = useState<number | null>(null)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dbOperationLoading, setDbOperationLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (search.trim() || filterLabel !== 'all') {
        const labelFilter = filterLabel === 'all' ? undefined : filterLabel === 'with_label'
        const searchQuery = {
          q: search.trim() || undefined,
          label_marked: labelFilter,
          limit,
          offset,
          sort_field: sortField,
          sort_direction: sortDirection
        }
        const items = await searchAddresses(searchQuery)
        setData(items)
      } else {
        const items = await listAddresses(limit, offset, sortField, sortDirection)
        setData(items)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Błąd pobierania')
    } finally {
      setLoading(false)
    }
  }, [search, filterLabel, limit, offset, sortField, sortDirection])

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

  const onLabelsClick = useCallback(() => {
    setLabelsOpen(true)
  }, [])

  const canExport = currentUser?.role === 'manager' || currentUser?.role === 'admin'
  const canImport = canExport // Same permissions as export
  const canManageDatabase = currentUser?.role === 'admin' // Only admin can manage database

  const handleFileImport = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Proszę wybrać plik CSV')
      return
    }

    setImportLoading(true)
    setImportResult(null)
    try {
      const result = await importAddressesCsv(file)
      setImportResult(result)
      // Refresh the data to show imported addresses
      await refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Błąd importu')
    } finally {
      setImportLoading(false)
    }
  }, [refresh])

  const onImportClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileImport(file)
      }
    }
    input.click()
  }, [handleFileImport])

  const downloadFile = useCallback(async (path: string, filename: string, accept: string) => {
    try {
      const url = token ? `${path}?token=${encodeURIComponent(token)}` : path
      const blob = await fetchBlob(url, { headers: { Accept: accept } })
      const link = document.createElement('a')
      const objUrl = URL.createObjectURL(blob)
      link.href = objUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objUrl)
    } catch (err: any) {
      alert(err?.message ?? 'Błąd pobierania pliku')
    }
  }, [token])

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

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setOffset(0)
  }, [sortField])

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <span style={{ color: '#666', fontSize: '12px' }}>↑</span> : <span style={{ color: '#666', fontSize: '12px' }}>↓</span>
  }

  const truncateText = (text: string | null, maxLength: number = 15): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '(...)'
  }

  const clearAllFilters = useCallback(() => {
    setSearch('')
    setFilterLabel('all')
    setOffset(0)
  }, [])

  const handleClearData = useCallback(async () => {
    const confirmed = confirm(
      'UWAGA: Ta operacja usunie wszystkie dane z tabeli adresów.\n\n' +
      'Czy na pewno chcesz kontynuować?\n\n' +
      'Ta operacja nie może być cofnięta!'
    )
    
    if (!confirmed) return

    setDbOperationLoading(true)
    try {
      await clearAddressesData()
      alert('Wszystkie dane zostały pomyślnie usunięte z tabeli adresów.')
      await refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Błąd podczas czyszczenia danych')
    } finally {
      setDbOperationLoading(false)
    }
  }, [refresh])

  const handleRecreateSchema = useCallback(async () => {
    const confirmed = confirm(
      'UWAGA: Ta operacja usunie tabelę adresów i utworzy ją od nowa.\n\n' +
      'Wszystkie dane zostaną bezpowrotnie utracone!\n\n' +
      'Czy na pewno chcesz kontynuować?\n\n' +
      'Ta operacja nie może być cofnięta!'
    )
    
    if (!confirmed) return

    setDbOperationLoading(true)
    try {
      await recreateAddressesSchema()
      alert('Tabela adresów została pomyślnie odtworzona z czystym schematem.')
      await refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Błąd podczas odtwarzania schematu tabeli')
    } finally {
      setDbOperationLoading(false)
    }
  }, [refresh])

  return (
    <div className="content">
      <PageHeader
        title="Kontakty"
        actions={(
          <>
            <DropdownMenu
              buttonLabel="Etykiety"
              buttonAriaLabel="Menu etykiet"
              groups={[{ label: 'Druk i podgląd', items: [{ label: 'Etykiety (3×7)', onSelect: onLabelsClick }]}]}
            />
            <button className="btn primary" onClick={onAddClick}>Dodaj kontakt</button>
            {(canImport || canExport || canManageDatabase) && (
              <DropdownMenu
                buttonLabel="Administracja bazy"
                buttonAriaLabel="Menu administracji bazy danych"
                groups={[
                  ...(canImport ? [{
                    label: 'Import',
                    items: [
                      { 
                        label: 'Import CSV', 
                        onSelect: onImportClick,
                        disabled: importLoading
                      },
                    ],
                  }] : []),
                  ...(canExport ? [{
                    label: 'Eksport',
                    items: [
                      { label: 'Eksport CSV', onSelect: () => downloadFile('/api/addresses/export.csv', 'addresses.csv', 'text/csv') },
                      { label: 'Eksport ODS', onSelect: () => downloadFile('/api/addresses/export.ods', 'addresses.ods', 'application/vnd.oasis.opendocument.spreadsheet') },
                      { label: 'Eksport PDF', onSelect: () => downloadFile('/api/addresses/export.pdf', 'addresses.pdf', 'application/pdf') },
                    ],
                  }] : []),
                  ...(canManageDatabase ? [{
                    label: 'Baza danych',
                    items: [
                      { 
                        label: 'Wyczyść dane', 
                        onSelect: handleClearData,
                        disabled: dbOperationLoading,
                        style: { color: '#dc3545' }
                      },
                      { 
                        label: 'Utwórz czysty schemat bazy', 
                        onSelect: handleRecreateSchema,
                        disabled: dbOperationLoading,
                        style: { color: '#dc3545' }
                      },
                    ],
                  }] : []),
                ]} />
            )}
          </>
        )}
      />
      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', minHeight: '52px' }}>
        <input className="input" placeholder="Szukaj (imię, nazwisko, adres)" value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }} style={{ minWidth: '300px', width: '30%' }} />
        <select 
          className="input" 
          value={filterLabel} 
          onChange={e => { setFilterLabel(e.target.value as 'all' | 'with_label' | 'without_label'); setOffset(0) }}
          style={{ minWidth: '180px' }}
        >
          <option value="all">Wszystkie kontakty</option>
          <option value="with_label">Z etykietą</option>
          <option value="without_label">Bez etykiety</option>
        </select>
        <button className="btn" onClick={refresh} disabled={loading}>Odśwież</button>
        <button className="btn" onClick={clearAllFilters} disabled={loading}>Wyczyść filtry</button>
        {/* Toolbar remains focused on filtrowanie i paginację */}
        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={goPrev} disabled={!canPrev}>«</button>
          <span>offset {offset}</span>
          <button className="btn" onClick={goNext} disabled={!canNext}>»</button>
        </div>
      </div>
      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
      {importLoading && <div className="info" style={{ marginBottom: 12 }}>Importowanie pliku CSV...</div>}
      {importResult && (
        <div className="info" style={{ marginBottom: 12 }}>
          <strong>Import zakończony:</strong> Zaimportowano {importResult.imported_count} z {importResult.total_rows} rekordów.
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Błędy:</strong>
              <ul style={{ marginTop: 4 }}>
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {importResult.has_more_errors && <li>... i więcej błędów</li>}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                onClick={() => handleSort('id')}
                title="Kliknij aby sortować"
              >
                ID {getSortIcon('id')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('first_name')}
                title="Kliknij aby sortować"
              >
                Imię {getSortIcon('first_name')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('last_name')}
                title="Kliknij aby sortować"
              >
                Nazwisko {getSortIcon('last_name')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('street')}
                title="Kliknij aby sortować"
              >
                Ulica {getSortIcon('street')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('apartment_no')}
                title="Kliknij aby sortować"
              >
                Nr m. {getSortIcon('apartment_no')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('city')}
                title="Kliknij aby sortować"
              >
                Miasto {getSortIcon('city')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('postal_code')}
                title="Kliknij aby sortować"
              >
                Kod {getSortIcon('postal_code')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('description')}
                title="Kliknij aby sortować"
              >
                Opis {getSortIcon('description')}
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('label_marked')}
                title="Kliknij aby sortować"
              >
                Etykieta {getSortIcon('label_marked')}
              </th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}>Ładowanie…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10}>Brak danych</td></tr>
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
                  <td title={row.description || ''}>{truncateText(row.description)}</td>
                  <td>{row.label_marked ? 'tak' : ''}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn icon"
                      onClick={() => onEnvelopeClick(row)}
                      title="Drukuj kopertę"
                      aria-label="Drukuj kopertę"
                    >
                      {/* Printer icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9V2h12v7" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2" />
                        <path d="M6 14h12v8H6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn icon"
                      onClick={() => onEditClick(row)}
                      style={{ marginLeft: 4 }}
                      title="Edytuj kontakt"
                      aria-label="Edytuj kontakt"
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
                      onClick={() => onDelete(row)}
                      style={{ marginLeft: 4 }}
                      title="Usuń kontakt"
                      aria-label="Usuń kontakt"
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

      <LabelsPreview
        open={labelsOpen}
        onClose={() => setLabelsOpen(false)}
      />
    </div>
  )
}


