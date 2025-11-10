import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi } from '../app/api'
import { useAuth } from '../app/auth'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithToken, currentUser, isLoading } = useAuth()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate('/app', { replace: true })
    }
  }, [currentUser, isLoading, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginApi(login, password)
      loginWithToken(res.access_token)
      navigate('/app/contacts', { replace: true })
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={onSubmit} className="card" style={{ minWidth: 420 }}>
        <h1 style={{ marginTop: 0, fontSize: 'var(--font-size-xl)' }}>Logowanie</h1>
        <div aria-hidden="true" style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />
        <label className="field">
          <span>Login</span>
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>Hasło</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div role="alert" className="error">{error}</div>}
        <div aria-hidden="true" style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary" disabled={loading} type="submit">
            {loading ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </div>
      </form>
    </div>
  )
}



