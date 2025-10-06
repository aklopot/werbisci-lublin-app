import React, { useCallback, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { DropdownMenu } from './DropdownMenu'
import { fetchBlob } from '../api'
import { LabelsPreview } from '../../modules/contacts/LabelsPreview'

export const AppLayout: React.FC = () => {
  const { currentUser, logout, token } = useAuth()
  const [labelsOpen, setLabelsOpen] = useState(false)

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

  return (
    <div className="app-shell">
      <div className="main">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/app" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img 
                src="/assets/logo-werbisci-nazwa.png" 
                alt="Werbiści logo" 
                style={{ height: 32 }}
              />
            </Link>
            <nav className="topnav" style={{ display: 'inline-flex', gap: 8 }}>
              <NavLink to="/app/contacts" className={({ isActive }) => isActive ? 'active' : ''}>Baza kontaktów</NavLink>
              {currentUser?.role === 'admin' && (
                <NavLink to="/app/users" className={({ isActive }) => isActive ? 'active' : ''}>Użytkownicy</NavLink>
              )}
            </nav>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="role-badge">{currentUser?.full_name}</span>
            <button className="btn" onClick={logout}>Wyloguj</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      <LabelsPreview open={labelsOpen} onClose={() => setLabelsOpen(false)} />
    </div>
  )
}



