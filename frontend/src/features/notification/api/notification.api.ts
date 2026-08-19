import { authStorage } from '@/features/auth'
import { axiosInstance } from '@/shared/api'

import type {
  MarkAllNotificationsReadResponse,
  NotificationUnreadCountResponse,
  NotificationsQueryParams,
  NotificationsResponse,
} from '../types/notification.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export const getNotifications = async (
  params: NotificationsQueryParams,
) => {
  const response = await axiosInstance.get<NotificationsResponse>(
    '/notifications',
    {
      params,
      headers: getAuthHeaders(),
    },
  )

  return response.data
}

export const getNotificationUnreadCount = async () => {
  const response = await axiosInstance.get<NotificationUnreadCountResponse>(
    '/notifications/unread-count',
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}

export const markNotificationAsRead = async (id: string) => {
  await axiosInstance.patch(`/notifications/${id}/read`, undefined, {
    headers: getAuthHeaders(),
  })
}

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.patch<MarkAllNotificationsReadResponse>(
    '/notifications/read-all',
    undefined,
    {
      headers: getAuthHeaders(),
    },
  )

  return response.data.data
}
