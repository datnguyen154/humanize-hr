import { AxiosError } from 'axios'

import type { ApiErrorResponse } from '@/shared/types'

export function getEmployeeDepartmentErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (!(error instanceof AxiosError)) {
    return fallback
  }

  const response = error.response?.data as ApiErrorResponse | undefined
  const message = response?.message

  if (message === 'Invalid departmentId') {
    return 'Phòng ban không hợp lệ.'
  }

  if (message === 'Department not found') {
    return 'Không tìm thấy phòng ban đã chọn.'
  }

  return fallback
}
