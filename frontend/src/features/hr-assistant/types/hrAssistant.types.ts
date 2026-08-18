export type HrAssistantQuestion = {
  key: string
  label: string
}

export type HrAssistantQuestionsResponse = {
  data: HrAssistantQuestion[]
}

export type HrAssistantQueryRequest = {
  questionKey: string
}

export type HrAssistantQueryResult = {
  questionKey: string
  answer: string
  type: 'TEXT'
}

export type HrAssistantQueryResponse = {
  data: HrAssistantQueryResult
}

export type HrAssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  questionKey?: string
}
