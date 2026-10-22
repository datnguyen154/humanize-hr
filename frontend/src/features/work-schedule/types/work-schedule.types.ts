export type WorkScheduleConfig = {
  effectiveFrom: string
  timezone: 'Asia/Ho_Chi_Minh'
  weekdays: number[]
  startTime: string
  endTime: string
  breaks: [{ startTime: string; endTime: string }]
}

export type WorkScheduleDto = WorkScheduleConfig & {
  id: string
  version: number
  revision: number
  status: 'DRAFT' | 'ACTIVE'
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export type WorkScheduleListParams = {
  page?: number
  limit?: number
}

export type PaginationMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type WorkScheduleListResponse = {
  data: WorkScheduleDto[]
  meta: PaginationMeta
}

export type CreateWorkScheduleRequest = {
  effectiveFrom: string
  timezone: 'Asia/Ho_Chi_Minh'
  weekdays: number[]
  startTime: string
  endTime: string
  breaks: [{ startTime: string; endTime: string }]
}

export type UpdateWorkScheduleRequest = {
  expectedRevision: number
  effectiveFrom?: string
  timezone?: 'Asia/Ho_Chi_Minh'
  weekdays?: number[]
  startTime?: string
  endTime?: string
  breaks?: [{ startTime: string; endTime: string }]
}

export type WorkScheduleErrorResponse = {
  code: string
  message: string
  details?: Record<string, string>
}
