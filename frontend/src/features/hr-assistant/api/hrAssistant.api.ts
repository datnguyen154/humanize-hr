import { axiosInstance } from '@/shared/api'

import { authStorage } from '../../auth'
import type {
  HrAssistantQueryRequest,
  HrAssistantQueryResponse,
  HrAssistantQuestionsResponse,
} from '../types/hrAssistant.types'

const getAuthHeaders = () => {
  const accessToken = authStorage.getAccessToken()

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export async function getHrAssistantQuestions() {
  const response = await axiosInstance.get<HrAssistantQuestionsResponse>(
    '/hr-assistant/questions',
    { headers: getAuthHeaders() },
  )

  return response.data.data
}

export async function queryHrAssistant(payload: HrAssistantQueryRequest) {
  const response = await axiosInstance.post<HrAssistantQueryResponse>(
    '/hr-assistant/query',
    payload,
    { headers: getAuthHeaders() },
  )

  return response.data.data
}
