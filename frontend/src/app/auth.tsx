import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { setAuthToken } from './api'
// import { logoutApi } from '../modules/login-sessions/api'

type UserRole = 'user' | 'manager' | 'admin'

export interface CurrentUser {
  id: number
  role: UserRole
  full_name: string
}

interface AuthState {
  token: string | null
  currentUser: CurrentUser | null
  isLoading: boolean
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

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

const TOKEN_KEY = 'auth_token'
const LAST_ACTIVITY_KEY = 'auth_last_activity'
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// TODO: Future enhancement - Session tracking in database
// When implementing session logging, track:
// - session_id (unique per login)
// - user_id
// - login_time (timestamp)
// - last_activity_time (updated on user actions)
// - logout_time (timestamp when session ends)
// - logout_reason ('manual' | 'inactivity' | 'token_expired')
// - ip_address (optional)
// - user_agent (optional)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    const now = Date.now().toString()
    localStorage.setItem(LAST_ACTIVITY_KEY, now)
  }, [])

  // Check if session is inactive for too long
  const checkInactivity = useCallback(() => {
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (!lastActivityStr) return false
    
    const lastActivity = parseInt(lastActivityStr, 10)
    const now = Date.now()
    const timeSinceActivity = now - lastActivity
    
    return timeSinceActivity >= INACTIVITY_TIMEOUT_MS
  }, [])

  // Setup inactivity timer
  const setupInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      if (checkInactivity()) {
        console.log('Session expired due to inactivity')
        
        // Send logout event to backend (fire and forget)
        const currentToken = localStorage.getItem(TOKEN_KEY)
        if (currentToken) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ reason: 'inactivity' })
          }).catch(() => {
            // Silently ignore errors during logout
          })
        }
        
        // Logout due to inactivity - directly clear without calling applyToken to avoid circular dependency
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(LAST_ACTIVITY_KEY)
        setAuthToken(undefined)
        setToken(null)
        setCurrentUser(null)
      }
    }, INACTIVITY_TIMEOUT_MS)
  }, [checkInactivity])

  // Track user activity
  useEffect(() => {
    if (!token) return

    const handleActivity = () => {
      updateLastActivity()
      setupInactivityTimer()
    }

    // Track various user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))

    // Initial setup
    updateLastActivity()
    setupInactivityTimer()

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity))
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [token, updateLastActivity, setupInactivityTimer])

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const saved = localStorage.getItem(TOKEN_KEY)
      if (saved) {
        // Check if token is expired
        if (isTokenExpired(saved)) {
          console.log('Token expired, clearing session')
          // Send logout event with token_expired reason (fire and forget)
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${saved}`
            },
            body: JSON.stringify({ reason: 'token_expired' })
          }).catch(() => {
            // Silently ignore errors during logout
          })
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(LAST_ACTIVITY_KEY)
          setAuthToken(undefined)
          setToken(null)
          setCurrentUser(null)
          setIsLoading(false)
          return
        }

        const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY)
        if (lastActivityStr) {
          const lastActivity = parseInt(lastActivityStr, 10)
          const now = Date.now()
          const timeSinceActivity = now - lastActivity
          
          // Check if session is inactive
          if (timeSinceActivity >= INACTIVITY_TIMEOUT_MS) {
            console.log('Session inactive, clearing session')
            // Send logout event to backend (fire and forget)
            fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${saved}`
              },
              body: JSON.stringify({ reason: 'inactivity' })
            }).catch(() => {
              // Silently ignore errors during logout
            })
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(LAST_ACTIVITY_KEY)
            setAuthToken(undefined)
            setToken(null)
            setCurrentUser(null)
            setIsLoading(false)
            return
          }
        }

        // Token is valid and session is active - restore session
        setToken(saved)
        setAuthToken(saved)
        localStorage.setItem(TOKEN_KEY, saved)
        
        const payload = decodeJwtPayload(saved)
        const userIdRaw = payload?.sub
        const roleRaw = payload?.role
        const fullNameRaw = payload?.full_name
        const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : Number(userIdRaw)
        const role: UserRole | undefined = roleRaw === 'admin' || roleRaw === 'manager' || roleRaw === 'user' ? roleRaw : undefined
        const fullName = typeof fullNameRaw === 'string' ? fullNameRaw : ''
        
        if (Number.isFinite(userId) && role && fullName) {
          setCurrentUser({ id: userId, role, full_name: fullName })
          const now = Date.now().toString()
          localStorage.setItem(LAST_ACTIVITY_KEY, now)
        } else {
          setCurrentUser(null)
        }
      } else {
        setAuthToken(undefined)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const applyToken = useCallback((newToken: string) => {
    setToken(newToken)
    setAuthToken(newToken)
    localStorage.setItem(TOKEN_KEY, newToken)
    const payload = decodeJwtPayload(newToken)
    const userIdRaw = payload?.sub
    const roleRaw = payload?.role
    const fullNameRaw = payload?.full_name
    const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : Number(userIdRaw)
    const role: UserRole | undefined = roleRaw === 'admin' || roleRaw === 'manager' || roleRaw === 'user' ? roleRaw : undefined
    const fullName = typeof fullNameRaw === 'string' ? fullNameRaw : ''
    if (Number.isFinite(userId) && role && fullName) {
      setCurrentUser({ id: userId, role, full_name: fullName })
      updateLastActivity()
    } else {
      setCurrentUser(null)
    }
  }, [updateLastActivity])

  const loginWithToken = useCallback((newToken: string) => {
    applyToken(newToken)
  }, [applyToken])

  const logout = useCallback(() => {
    // Send logout event to backend (fire and forget)
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'manual' })
      }).catch(() => {
        // Silently ignore errors during logout
      })
    }
    
    // Manual logout - directly clear state
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    setAuthToken(undefined)
    setToken(null)
    setCurrentUser(null)
  }, [token])

  const value = useMemo<AuthState>(
    () => ({ token, currentUser, isLoading, loginWithToken, logout }),
    [token, currentUser, isLoading, loginWithToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}



