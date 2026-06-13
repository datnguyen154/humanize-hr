import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminDashboardPage } from '../pages/admin/dashboard/AdminDashboardPage'
import { EmployeeDashboardPage } from '../pages/employee/dashboard/EmployeeDashboardPage'
import { LoginPage } from '../pages/login'
import { ProtectedRoute } from './router/ProtectedRoute'
import { RoleGuard } from './router/RoleGuard'

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
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['ADMIN']}>
          <AdminDashboardPage />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/employee/dashboard',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['EMPLOYEE']}>
          <EmployeeDashboardPage />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
])
