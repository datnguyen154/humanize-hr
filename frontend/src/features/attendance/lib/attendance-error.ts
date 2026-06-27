import { AxiosError } from 'axios'

import type { ApiErrorResponse } from '@/shared/types'

export function getAttendanceErrorMessage(
  error: unknown,
  action: 'check-in' | 'check-out',
) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    if (message === 'Already checked in today') {
      return 'Bạn đã check in hôm nay rồi'
    }

    if (message === 'Already checked out today') {
      return 'Bạn đã check out hôm nay rồi'
    }
  }

  return action === 'check-in' ? 'Không thể check in' : 'Không thể check out'
}
