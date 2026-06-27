import { useMutation } from '@tanstack/react-query'

import { checkIn } from '../api/attendance.api'

export function useCheckInMutation() {
  return useMutation({
    mutationFn: checkIn,
  })
}
