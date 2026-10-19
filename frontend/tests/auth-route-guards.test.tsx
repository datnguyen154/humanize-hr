import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useAuthStore } from '@/features/auth/model/auth.store'
import type { UserRole } from '@/features/auth/types/auth.types'

function setup() {
  render(<MemoryRouter initialEntries={['/admin/secure']}><Routes>
    <Route path="/login" element={<p>Đăng nhập</p>} />
    <Route path="/employee/dashboard" element={<p>Bảng điều khiển nhân viên</p>} />
    <Route path="/admin/secure" element={<ProtectedRoute><RoleGuard allowedRoles={['ADMIN']}><p>Nội dung quản trị</p></RoleGuard></ProtectedRoute>} />
  </Routes></MemoryRouter>)
}

function signIn(role: UserRole) {
  useAuthStore.getState().setUser({ id: 'test-user', email: 'test@example.com', fullName: 'Test User', role })
}

describe('protected routes and roles', () => {
  beforeEach(() => useAuthStore.setState({ user: null, isAuthenticated: false, isAuthRestoring: false }))

  it('redirects anonymous users to login', () => {
    setup()
    expect(screen.getByText('Đăng nhập')).toBeTruthy()
    expect(screen.queryByText('Nội dung quản trị')).toBeNull()
  })

  it('waits for restoration before rendering protected content', () => {
    useAuthStore.setState({ isAuthRestoring: true })
    setup()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByText('Đăng nhập')).toBeNull()
    act(() => signIn('ADMIN'))
    expect(screen.getByText('Nội dung quản trị')).toBeTruthy()
  })

  it('redirects employees from admin content to their own dashboard', () => {
    signIn('EMPLOYEE')
    setup()
    expect(screen.getByText('Bảng điều khiển nhân viên')).toBeTruthy()
    expect(screen.queryByText('Nội dung quản trị')).toBeNull()
  })

  it('redirects immediately when authenticated state is cleared', () => {
    signIn('ADMIN')
    setup()
    act(() => useAuthStore.getState().clearUser())
    expect(screen.getByText('Đăng nhập')).toBeTruthy()
  })
})
