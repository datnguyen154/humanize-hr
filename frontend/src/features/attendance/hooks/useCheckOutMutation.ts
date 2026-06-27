import { useMutation } from '@tanstack/react-query'

import { checkOut } from '../api/attendance.api'

export function useCheckOutMutation() {
  return useMutation({
    mutationFn: checkOut,
  })
}
