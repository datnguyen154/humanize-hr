import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminDashboardPage } from '../pages/admin/dashboard/AdminDashboardPage'
import { AttendanceListPage } from '../pages/admin/attendance/AttendanceListPage'
import { CreateDepartmentPage } from '../pages/admin/departments/CreateDepartmentPage'
import { DepartmentDetailPage } from '../pages/admin/departments/DepartmentDetailPage'
import { EditDepartmentPage } from '../pages/admin/departments/EditDepartmentPage'
import { DepartmentListPage } from '../pages/admin/departments/DepartmentListPage'
import { CreateEmployeePage } from '../pages/admin/employees/CreateEmployeePage'
import { EditEmployeePage } from '../pages/admin/employees/EditEmployeePage'
import { EmployeeDetailPage } from '../pages/admin/employees/EmployeeDetailPage'
import { EmployeeListPage } from '../pages/admin/employees/EmployeeListPage'
import { LeaveRequestDetailPage } from '../pages/admin/leave-requests/LeaveRequestDetailPage'
import { LeaveRequestListPage } from '../pages/admin/leave-requests/LeaveRequestListPage'
import { AttendanceHistoryPage } from '../pages/employee/attendance/AttendanceHistoryPage'
import { EmployeeChangePasswordPage } from '../pages/employee/change-password/EmployeeChangePasswordPage'
import { EmployeeDashboardPage } from '../pages/employee/dashboard/EmployeeDashboardPage'
import { CreateLeaveRequestPage } from '../pages/employee/leave-requests/CreateLeaveRequestPage'
import { EmployeeLeaveRequestListPage } from '../pages/employee/leave-requests/EmployeeLeaveRequestListPage'
import { EmployeeProfilePage } from '../pages/employee/profile/EmployeeProfilePage'
import { LoginPage } from '../pages/login'
import { AdminLayout } from '../widgets/layouts/admin-layout/AdminLayout'
import { EmployeeLayout } from '../widgets/layouts/employee-layout/EmployeeLayout'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicRoute } from './router/PublicRoute'
import { RoleGuard } from './router/RoleGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
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
        path: 'attendance',
        element: <AttendanceListPage />,
      },
      {
        path: 'departments',
        element: <DepartmentListPage />,
      },
      {
        path: 'departments/create',
        element: <CreateDepartmentPage />,
      },
      {
        path: 'departments/:id/edit',
        element: <EditDepartmentPage />,
      },
      {
        path: 'departments/:id',
        element: <DepartmentDetailPage />,
      },
      {
        path: 'employees',
        element: <EmployeeListPage />,
      },
      {
        path: 'employees/create',
        element: <CreateEmployeePage />,
      },
      {
        path: 'employees/:id/edit',
        element: <EditEmployeePage />,
      },
      {
        path: 'employees/:id',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'leave-requests',
        element: <LeaveRequestListPage />,
      },
      {
        path: 'leave-requests/create',
        element: <Navigate to="/admin/leave-requests" replace />,
      },
      {
        path: 'leave-requests/:id',
        element: <LeaveRequestDetailPage />,
      },
    ],
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['EMPLOYEE']}>
          <EmployeeLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <EmployeeDashboardPage />,
      },
      {
        path: 'profile',
        element: <EmployeeProfilePage />,
      },
      {
        path: 'change-password',
        element: <EmployeeChangePasswordPage />,
      },
      {
        path: 'attendance',
        element: <AttendanceHistoryPage />,
      },
      {
        path: 'leave-requests',
        element: <EmployeeLeaveRequestListPage />,
      },
      {
        path: 'leave-requests/create',
        element: <CreateLeaveRequestPage />,
      },
      {
        path: 'leave-requests/:id',
        element: (
          <LeaveRequestDetailPage backPath="/employee/leave-requests" />
        ),
      },
    ],
  },
])
