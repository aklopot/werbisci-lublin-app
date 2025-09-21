import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setAuthToken } from './api'

type UserRole = 'user' | 'manager' | 'admin'

export interface CurrentUser {
  id: number
  role: UserRole
}

interface AuthState {
  token: string | null
  currentUser: CurrentUser | null
  loginWithToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const TOKEN_KEY = 'auth_token'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
      applyToken(saved)
    } else {
      setAuthToken(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyToken = useCallback((newToken: string | null) => {
    setToken(newToken)
    setAuthToken(newToken ?? undefined)
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
      const payload = decodeJwtPayload(newToken)
      const userIdRaw = payload?.sub
      const roleRaw = payload?.role
      const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : Number(userIdRaw)
      const role: UserRole | undefined = roleRaw === 'admin' || roleRaw === 'manager' || roleRaw === 'user' ? roleRaw : undefined
      if (Number.isFinite(userId) && role) {
        setCurrentUser({ id: userId, role })
      } else {
        setCurrentUser(null)
      }
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setCurrentUser(null)
    }
  }, [])

  const loginWithToken = useCallback((newToken: string) => {
    applyToken(newToken)
  }, [applyToken])

  const logout = useCallback(() => {
    applyToken(null)
  }, [applyToken])

  const value = useMemo<AuthState>(() => ({ token, currentUser, loginWithToken, logout }), [token, currentUser, loginWithToken, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}



