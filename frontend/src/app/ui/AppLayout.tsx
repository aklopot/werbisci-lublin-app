import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export const AppLayout: React.FC = () => {
  const { currentUser, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Link to="/app">Werbiści</Link>
        </div>
        <nav className="nav">
          <NavLink to="/app/contacts" className={({ isActive }) => isActive ? 'active' : ''}>Baza kontaktów</NavLink>
          {currentUser?.role === 'admin' && (
            <NavLink to="/app/users" className={({ isActive }) => isActive ? 'active' : ''}>Użytkownicy</NavLink>
          )}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div />
          <div className="user-actions">
            <span className="role-badge">{currentUser?.role}</span>
            <button className="btn" onClick={logout}>Wyloguj</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}



