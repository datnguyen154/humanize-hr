import {
  Bell,
  CheckCircle2,
  ClipboardList,
  UserRoundCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuthStore } from '@/features/auth'
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from '@/features/notification/hooks/useNotificationMutations'
import {
  useNotificationUnreadCountQuery,
  useNotificationsQuery,
} from '@/features/notification/hooks/useNotificationsQuery'
import type {
  Notification,
  NotificationType,
} from '@/features/notification/types/notification.types'

const notificationIcon: Record<NotificationType, LucideIcon> = {
  LEAVE_REQUEST_CREATED: ClipboardList,
  LEAVE_REQUEST_APPROVED: CheckCircle2,
  LEAVE_REQUEST_REJECTED: XCircle,
  LEAVE_REQUEST_ASSIGNED: UserRoundCheck,
}

const formatNotificationDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))

const getNotificationPath = (role: 'ADMIN' | 'EMPLOYEE', notification: Notification) => {
  if (notification.entityType !== 'LEAVE_REQUEST') {
    return null
  }

  return role === 'ADMIN'
    ? `/admin/leave-requests/${notification.entityId}`
    : `/employee/leave-requests/${notification.entityId}`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [isOpen, setIsOpen] = useState(false)
  const unreadCountQuery = useNotificationUnreadCountQuery()
  const notificationsQuery = useNotificationsQuery(
    { page: 1, limit: 10 },
    isOpen,
  )
  const markReadMutation = useMarkNotificationAsReadMutation()
  const markAllReadMutation = useMarkAllNotificationsAsReadMutation()
  const unreadCount = Math.max(0, unreadCountQuery.data?.count ?? 0)
  const notifications = notificationsQuery.data?.data ?? []

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id)
    }

    setIsOpen(false)

    if (user) {
      const path = getNotificationPath(user.role, notification)
      if (path) {
        navigate(path)
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0 text-muted-foreground hover:text-primary"
          aria-label={`Thông báo, ${unreadCount} chưa đọc`}
          title="Thông báo"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1 text-center text-[10px] font-semibold leading-5 text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Thông báo</h2>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 px-0 text-xs"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              {markAllReadMutation.isPending
                ? 'Đang cập nhật...'
                : 'Đánh dấu tất cả đã đọc'}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Đang tải thông báo...
            </p>
          ) : null}

          {notificationsQuery.isError ? (
            <div className="grid gap-3 px-4 py-8 text-center">
              <p className="text-sm text-destructive">Không thể tải thông báo.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mx-auto"
                onClick={() => void notificationsQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : null}

          {notificationsQuery.isSuccess && notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Bạn chưa có thông báo nào.
            </p>
          ) : null}

          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = notificationIcon[notification.type]

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none ${
                      notification.isRead ? 'bg-card' : 'bg-primary/5'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={`break-words text-sm text-foreground ${
                            notification.isRead ? 'font-medium' : 'font-semibold'
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!notification.isRead ? (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                            aria-label="Chưa đọc"
                          />
                        ) : null}
                      </span>
                      <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1.5 block text-[11px] text-muted-foreground">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
