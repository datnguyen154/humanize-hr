import { useMutation } from '@tanstack/react-query'

import { queryHrAssistant } from '../api/hrAssistant.api'
import type { HrAssistantQueryRequest } from '../types/hrAssistant.types'

export function useHrAssistantQueryMutation() {
  return useMutation({
    mutationFn: (payload: HrAssistantQueryRequest) => queryHrAssistant(payload),
  })
}
