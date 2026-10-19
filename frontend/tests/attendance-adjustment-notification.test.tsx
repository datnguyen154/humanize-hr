import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { NotificationBell } from '@/shared/components/NotificationBell'
import { useAuthStore } from '@/features/auth'
import { useNotificationsQuery, useNotificationUnreadCountQuery } from '@/features/notification/hooks/useNotificationsQuery'

const { markRead } = vi.hoisted(() => ({ markRead: vi.fn() }))
vi.mock('@/features/notification/hooks/useNotificationsQuery', () => ({
  useNotificationsQuery: vi.fn(), useNotificationUnreadCountQuery: vi.fn(),
}))
vi.mock('@/features/notification/hooks/useNotificationMutations', () => ({
  useMarkNotificationAsReadMutation: () => ({ mutate: markRead }),
  useMarkAllNotificationsAsReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().setUser({ id: 'admin', role: 'ADMIN', fullName: 'Quản trị viên', email: 'admin@example.com' })
})

it.each([
  ['ATTENDANCE_ADJUSTMENT', 'ATTENDANCE_ADJUSTMENT_CREATED', '/admin/attendance/adjustments/request-1'],
  ['LEAVE_REQUEST', 'LEAVE_REQUEST_CREATED', '/admin/leave-requests/request-1'],
])('opens %s details from an unread notification', async (entityType, type, path) => {
  vi.mocked(useNotificationUnreadCountQuery).mockReturnValue({ data: { count: 1 } } as ReturnType<typeof useNotificationUnreadCountQuery>)
  vi.mocked(useNotificationsQuery).mockReturnValue({
    data: { data: [{ id: 'notification-1', entityId: 'request-1', entityType, type,
      title: 'Có yêu cầu mới', message: 'Nhân viên vừa gửi yêu cầu.', isRead: false,
      createdAt: '2026-10-19T03:00:00.000Z' }] },
    isSuccess: true, isLoading: false, isError: false,
  } as ReturnType<typeof useNotificationsQuery>)
  render(<MemoryRouter><Routes>
    <Route path="/" element={<NotificationBell />} />
    <Route path={path} element={<p>Chi tiết yêu cầu</p>} />
  </Routes></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo, 1 chưa đọc' }))
  fireEvent.click(await screen.findByRole('button', { name: /Có yêu cầu mới/ }))
  expect(await screen.findByText('Chi tiết yêu cầu')).toBeTruthy()
  expect(markRead).toHaveBeenCalledWith('notification-1')
})
