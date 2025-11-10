import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../modules/LoginPage'
import { AppLayout } from './ui/AppLayout'
import { useAuth } from './auth'
import { UsersListPage } from '../modules/users/UsersListPage'
import { ContactsListPage } from '../modules/contacts/ContactsListPage'
import { InfoPage } from '../modules/InfoPage'

type RequireAuthProps = { children: React.ReactNode }

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth()
  
  // Wait for auth initialization to complete
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    )
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const ContactsPage: React.FC = () => <ContactsListPage />

const RootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    )
  }
  
  return <Navigate to={currentUser ? "/app" : "/login"} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="contacts" replace /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'info', element: <InfoPage /> },
    ],
  },
])



