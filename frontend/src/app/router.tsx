import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminDashboardPage } from '../pages/admin/dashboard/AdminDashboardPage'
import { EmployeeListPage } from '../pages/admin/employees/EmployeeListPage'
import { EmployeeDashboardPage } from '../pages/employee/dashboard/EmployeeDashboardPage'
import { LoginPage } from '../pages/login'
import { AdminLayout } from '../widgets/layouts/admin-layout/AdminLayout'
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
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['ADMIN']}>
          <AdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'employees',
        element: <EmployeeListPage />,
      },
    ],
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
