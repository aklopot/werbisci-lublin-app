export interface LoginSession {
  id: number
  user_id: number
  login_time: string
  logout_time: string | null
  logout_reason: string | null
  ip_address: string | null
  user_agent: string | null
}

export interface LoginSessionSearchQuery {
  user_id?: number
  active_only?: boolean
  q?: string
  limit?: number
  offset?: number
  sort_field?: string
  sort_direction?: 'asc' | 'desc'
}

export interface DatabaseOperationResult {
  message: string
  status: string
}

export interface ActiveSessionsCount {
  active_sessions: number
}

