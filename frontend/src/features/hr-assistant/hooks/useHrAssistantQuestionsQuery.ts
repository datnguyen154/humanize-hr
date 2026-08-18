import { useQuery } from '@tanstack/react-query'

import { getHrAssistantQuestions } from '../api/hrAssistant.api'

export const hrAssistantQueryKeys = {
  questions: ['hr-assistant', 'questions'] as const,
}

export function useHrAssistantQuestionsQuery(enabled = true) {
  return useQuery({
    queryKey: hrAssistantQueryKeys.questions,
    queryFn: getHrAssistantQuestions,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
