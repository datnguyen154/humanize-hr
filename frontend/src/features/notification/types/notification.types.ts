export type NotificationType =
  | 'LEAVE_REQUEST_CREATED'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'LEAVE_REQUEST_ASSIGNED'

export type NotificationEntityType = 'LEAVE_REQUEST'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  entityType: NotificationEntityType
  entityId: string
  isRead: boolean
  createdAt: string
}

export type NotificationsQueryParams = {
  page: number
  limit: number
  unreadOnly?: boolean
}

export type NotificationsMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type NotificationsResponse = {
  data: Notification[]
  meta: NotificationsMeta
}

export type NotificationUnreadCountResponse = {
  data: {
    count: number
  }
}

export type MarkAllNotificationsReadResponse = {
  data: {
    updatedCount: number
  }
}
