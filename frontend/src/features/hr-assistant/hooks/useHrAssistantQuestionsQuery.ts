import { useQuery } from '@tanstack/react-query'

import { getHrAssistantQuestions } from '../api/hrAssistant.api'
import { adminAssistantQuestions } from '../lib/adminHrAssistant'
import type { HrAssistantAudience, HrAssistantQuestion } from '../types/hrAssistant.types'

export const hrAssistantQueryKeys = {
  questions: ['hr-assistant', 'questions'] as const,
  adminQuestions: ['hr-assistant', 'admin', 'questions'] as const,
}

export function useHrAssistantQuestionsQuery(enabled = true, audience: HrAssistantAudience = 'employee') {
  return useQuery<HrAssistantQuestion[]>({
    queryKey: audience === 'admin' ? hrAssistantQueryKeys.adminQuestions : hrAssistantQueryKeys.questions,
    queryFn: audience === 'admin'
      ? async () => [...adminAssistantQuestions]
      : getHrAssistantQuestions,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
