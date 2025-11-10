import { fetchJson } from '../../app/api'
import type { LoginSession, LoginSessionSearchQuery, DatabaseOperationResult, ActiveSessionsCount } from './types'

export async function listLoginSessions(
  limit: number = 50,
  offset: number = 0,
  sortField: string = 'login_time',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<LoginSession[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    sort_field: sortField,
    sort_direction: sortDirection,
  })
  return fetchJson<LoginSession[]>(`/api/login-sessions?${params}`)
}

export async function searchLoginSessions(query: LoginSessionSearchQuery): Promise<LoginSession[]> {
  const params = new URLSearchParams()
  if (query.user_id !== undefined) params.set('user_id', query.user_id.toString())
  if (query.active_only !== undefined) params.set('active_only', query.active_only.toString())
  if (query.q) params.set('q', query.q)
  if (query.limit !== undefined) params.set('limit', query.limit.toString())
  if (query.offset !== undefined) params.set('offset', query.offset.toString())
  if (query.sort_field) params.set('sort_field', query.sort_field)
  if (query.sort_direction) params.set('sort_direction', query.sort_direction)
  
  return fetchJson<LoginSession[]>(`/api/login-sessions/search?${params}`)
}

export async function getActiveSessionsCount(): Promise<ActiveSessionsCount> {
  return fetchJson<ActiveSessionsCount>('/api/login-sessions/active-count')
}

export async function clearLoginSessionsData(): Promise<DatabaseOperationResult> {
  return fetchJson<DatabaseOperationResult>('/api/login-sessions/clear-data', { method: 'DELETE' })
}

export async function recreateLoginSessionsSchema(): Promise<DatabaseOperationResult> {
  return fetchJson<DatabaseOperationResult>('/api/login-sessions/recreate-schema', { method: 'POST' })
}

export async function logoutApi(reason: string = 'manual'): Promise<{ message: string }> {
  return fetchJson<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    body: { reason },
  })
}

