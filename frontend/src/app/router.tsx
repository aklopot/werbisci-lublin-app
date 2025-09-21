import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../modules/LoginPage'
import { AppLayout } from './ui/AppLayout'
import { useAuth } from './auth'
import { UsersListPage } from '../modules/users/UsersListPage'
import { ContactsListPage } from '../modules/contacts/ContactsListPage'

type RequireAuthProps = { children: React.ReactNode }

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const ContactsPage: React.FC = () => <ContactsListPage />

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
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
    ],
  },
])



