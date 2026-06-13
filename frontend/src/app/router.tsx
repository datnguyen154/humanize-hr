import { createBrowserRouter, Navigate } from 'react-router-dom'

import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { LoginPage } from '../pages/login'
import { ProtectedRoute } from './router/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
])
