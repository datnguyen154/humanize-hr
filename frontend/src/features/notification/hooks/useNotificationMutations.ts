import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notification.api'
import { notificationQueryKeys } from './useNotificationsQuery'

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(),
      })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(),
      })
    },
  })
}
