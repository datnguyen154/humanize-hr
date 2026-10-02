import { useMutation } from '@tanstack/react-query'

import { queryHrAssistant } from '../api/hrAssistant.api'
import { queryAdminHrAssistant } from '../lib/adminHrAssistant'
import type { HrAssistantAudience, HrAssistantQueryRequest } from '../types/hrAssistant.types'

export function useHrAssistantQueryMutation(audience: HrAssistantAudience = 'employee') {
  return useMutation({
    mutationFn: (payload: HrAssistantQueryRequest) => audience === 'admin'
      ? queryAdminHrAssistant(payload.questionKey)
      : queryHrAssistant(payload),
  })
}
