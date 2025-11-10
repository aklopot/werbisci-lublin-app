import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { LoginSession } from './types'
import { listLoginSessions, searchLoginSessions, clearLoginSessionsData, recreateLoginSessionsSchema, getActiveSessionsCount } from './api'
import { useAuth } from '../../app/auth'
import { DropdownMenu } from '../../app/ui/DropdownMenu'
import type { User } from '../users/types'

interface Props {
  users: User[]
}

export const LoginSessionsTable: React.FC<Props> = ({ users }) => {
  const { currentUser } = useAuth()
  const [data, setData] = useState<LoginSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterUserId, setFilterUserId] = useState<number | undefined>(undefined)
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [sortField, setSortField] = useState<string>('login_time')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [dbOperationLoading, setDbOperationLoading] = useState(false)
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (search.trim() || filterUserId !== undefined || showActiveOnly) {
        const searchQuery = {
          q: search.trim() || undefined,
          user_id: filterUserId,
          active_only: showActiveOnly,
          limit,
          offset,
          sort_field: sortField,
          sort_direction: sortDirection,
        }
        const items = await searchLoginSessions(searchQuery)
        setData(items)
      } else {
        const items = await listLoginSessions(limit, offset, sortField, sortDirection)
        setData(items)
      }
      
      // Fetch active sessions count
      const countResult = await getActiveSessionsCount()
      setActiveSessionsCount(countResult.active_sessions)
    } catch (err: any) {
      setError(err?.message ?? 'Błąd pobierania')
    } finally {
      setLoading(false)
    }
  }, [search, filterUserId, showActiveOnly, limit, offset, sortField, sortDirection])

  useEffect(() => { refresh() }, [refresh])

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

  const clearAllFilters = useCallback(() => {
    setSearch('')
    setFilterUserId(undefined)
    setShowActiveOnly(false)
    setOffset(0)
  }, [])

  const handleClearData = useCallback(async () => {
    const confirmed = confirm(
      'UWAGA: Ta operacja usunie wszystkie dane z tabeli logowań.\n\n' +
      'Czy na pewno chcesz kontynuować?\n\n' +
      'Ta operacja nie może być cofnięta!'
    )
    
    if (!confirmed) return

    setDbOperationLoading(true)
    try {
      await clearLoginSessionsData()
      alert('Wszystkie dane zostały pomyślnie usunięte z tabeli logowań.')
      await refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Błąd podczas czyszczenia danych')
    } finally {
      setDbOperationLoading(false)
    }
  }, [refresh])

  const handleRecreateSchema = useCallback(async () => {
    const confirmed = confirm(
      'UWAGA: Ta operacja usunie tabelę logowań i utworzy ją od nowa.\n\n' +
      'Wszystkie dane zostaną bezpowrotnie utracone!\n\n' +
      'Czy na pewno chcesz kontynuować?\n\n' +
      'Ta operacja nie może być cofnięta!'
    )
    
    if (!confirmed) return

    setDbOperationLoading(true)
    try {
      await recreateLoginSessionsSchema()
      alert('Tabela logowań została pomyślnie odtworzona z czystym schematem.')
      await refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Błąd podczas odtwarzania schematu tabeli')
    } finally {
      setDbOperationLoading(false)
    }
  }, [refresh])

  const canPrev = offset > 0
  const canNext = data.length === limit

  const goPrev = useCallback(() => { if (canPrev) setOffset(o => Math.max(0, o - limit)) }, [canPrev, limit])
  const goNext = useCallback(() => { if (canNext) setOffset(o => o + limit) }, [canNext, limit])

  const getUserName = useCallback((userId: number): string => {
    const user = users.find(u => u.id === userId)
    return user ? `${user.full_name} (${user.login})` : `ID: ${userId}`
  }, [users])

  const formatDateTime = useCallback((dateStr: string | null): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [])

  const getLogoutReasonLabel = useCallback((reason: string | null, logoutTime: string | null): string => {
    if (!logoutTime) return 'AKTYWNA SESJA'
    if (!reason) return 'Wylogowano'
    switch (reason) {
      case 'manual':
        return 'Ręcznie'
      case 'inactivity':
        return 'Automatycznie (1h nieaktywności)'
      case 'token_expired':
        return 'Token wygasł'
      default:
        return reason
    }
  }, [])

  const isActiveSession = useCallback((session: LoginSession): boolean => {
    return !session.logout_time
  }, [])

  const canManageDatabase = currentUser?.role === 'admin'

  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Logowania</h2>
        {canManageDatabase && (
          <DropdownMenu
            buttonLabel="Administracja bazy logowań"
            buttonAriaLabel="Menu administracji bazy danych logowań"
            groups={[
              {
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
              },
            ]}
          />
        )}
      </div>
      
      {activeSessionsCount > 0 && (
        <div className="info" style={{ marginBottom: 12, fontWeight: 'bold' }}>
          ⚠️ Aktywnych sesji: {activeSessionsCount}. Nie wykonuj aktualizacji aplikacji gdy użytkownicy są zalogowani!
        </div>
      )}

      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', minHeight: '38px', marginBottom: '12px' }}>
        <input
          className="input"
          placeholder="Szukaj (IP, User-Agent, powód)"
          value={search}
          onChange={e => { setSearch(e.target.value); setOffset(0) }}
          style={{ minWidth: '250px' }}
        />
        <select
          className="input"
          value={filterUserId ?? ''}
          onChange={e => { setFilterUserId(e.target.value ? parseInt(e.target.value) : undefined); setOffset(0) }}
          style={{ minWidth: '200px' }}
        >
          <option value="">Wszyscy użytkownicy</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.login})
            </option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={e => { setShowActiveOnly(e.target.checked); setOffset(0) }}
          />
          Tylko aktywne
        </label>
        <button className="btn" onClick={refresh} disabled={loading}>Odśwież</button>
        <button className="btn" onClick={clearAllFilters} disabled={loading}>Wyczyść filtry</button>
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
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('id')}
                title="Kliknij aby sortować"
              >
                ID {getSortIcon('id')}
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('user_id')}
                title="Kliknij aby sortować"
              >
                Użytkownik {getSortIcon('user_id')}
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('login_time')}
                title="Kliknij aby sortować"
              >
                Zalogowano {getSortIcon('login_time')}
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('logout_time')}
                title="Kliknij aby sortować"
              >
                Wylogowano {getSortIcon('logout_time')}
              </th>
              <th>Powód wylogowania</th>
              <th>IP</th>
              <th>User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Ładowanie…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7}>Brak danych</td></tr>
            ) : (
              data.map(row => (
                <tr
                  key={row.id}
                  style={isActiveSession(row) ? { backgroundColor: '#fff3cd', fontWeight: 'bold' } : {}}
                >
                  <td>{row.id}</td>
                  <td>{getUserName(row.user_id)}</td>
                  <td>{formatDateTime(row.login_time)}</td>
                  <td>{formatDateTime(row.logout_time)}</td>
                  <td>{getLogoutReasonLabel(row.logout_reason, row.logout_time)}</td>
                  <td>{row.ip_address ?? '-'}</td>
                  <td title={row.user_agent ?? ''}>
                    {row.user_agent ? (row.user_agent.length > 50 ? row.user_agent.substring(0, 50) + '...' : row.user_agent) : '-'}
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

