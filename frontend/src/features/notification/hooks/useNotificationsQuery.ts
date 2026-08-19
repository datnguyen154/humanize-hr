import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  getNotificationUnreadCount,
  getNotifications,
} from '../api/notification.api'
import type { NotificationsQueryParams } from '../types/notification.types'

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (params: NotificationsQueryParams) =>
    [...notificationQueryKeys.lists(), params] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
}

export function useNotificationsQuery(
  params: NotificationsQueryParams,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getNotifications(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useNotificationUnreadCountQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: getNotificationUnreadCount,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
