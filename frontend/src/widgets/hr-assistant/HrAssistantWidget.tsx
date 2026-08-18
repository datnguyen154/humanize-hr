import { AxiosError } from 'axios'
import { Bot, Loader2, MessageCircle, RefreshCw, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useHrAssistantQuestionsQuery,
  useHrAssistantQueryMutation,
  type HrAssistantMessage,
  type HrAssistantQuestion,
} from '@/features/hr-assistant'

const GREETING =
  'Xin chào! Tôi có thể giúp bạn tra cứu nhanh một số thông tin nhân sự. Hãy chọn một câu hỏi bên dưới.'

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

const getAssistantErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) {
      return 'Không tìm thấy hồ sơ nhân viên của bạn.'
    }

    if (error.response?.status === 400) {
      return 'Câu hỏi không hợp lệ. Vui lòng chọn lại câu hỏi gợi ý.'
    }

    if (error.response?.status === 403) {
      return 'Bạn không có quyền sử dụng Trợ lý HR.'
    }
  }

  return 'Trợ lý HR hiện không thể trả lời. Vui lòng thử lại sau.'
}

function MessageBubble({ message }: { message: HrAssistantMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-5 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  )
}

function QuestionSuggestions({
  questions,
  disabled,
  onSelect,
}: {
  questions: HrAssistantQuestion[]
  disabled: boolean
  onSelect: (question: HrAssistantQuestion) => void
}) {
  return (
    <section className="grid gap-2" aria-labelledby="hr-assistant-suggestions">
      <h3
        id="hr-assistant-suggestions"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Câu hỏi gợi ý
      </h3>
      <div className="grid gap-2">
        {questions.map((question) => (
          <Button
            key={question.key}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-auto min-h-9 justify-start whitespace-normal px-3 py-2 text-left text-sm font-normal"
            onClick={() => onSelect(question)}
          >
            <Send className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="break-words">{question.label}</span>
          </Button>
        ))}
      </div>
    </section>
  )
}

export function HrAssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<HrAssistantMessage[]>([
    {
      id: 'hr-assistant-greeting',
      role: 'assistant',
      content: GREETING,
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const questionsQuery = useHrAssistantQuestionsQuery(open)
  const queryMutation = useHrAssistantQueryMutation()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, queryMutation.isPending])

  const appendMessage = (message: Omit<HrAssistantMessage, 'id'>) => {
    setMessages((current) => [...current, { id: createMessageId(), ...message }])
  }

  const handleQuestionSelect = async (question: HrAssistantQuestion) => {
    if (queryMutation.isPending) return

    appendMessage({
      role: 'user',
      content: question.label,
      questionKey: question.key,
    })

    try {
      const result = await queryMutation.mutateAsync({
        questionKey: question.key,
      })

      appendMessage({
        role: 'assistant',
        content: result.answer,
        questionKey: result.questionKey,
      })
    } catch (error) {
      appendMessage({
        role: 'assistant',
        content: getAssistantErrorMessage(error),
      })
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {!open ? (
        <Button
          type="button"
          size="icon"
          className="size-12 rounded-full shadow-lg"
          aria-label="Mở Trợ lý HR"
          title="Trợ lý HR"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
        </Button>
      ) : (
        <Card
          role="dialog"
          aria-modal="false"
          aria-labelledby="hr-assistant-title"
          className="flex h-[min(680px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden shadow-xl"
        >
          <CardHeader className="shrink-0 flex-row items-start justify-between gap-3 border-b border-border p-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <CardTitle id="hr-assistant-title" className="text-base">
                  Trợ lý HR
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tra cứu nhanh thông tin nhân sự
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Đóng Trợ lý HR"
              title="Đóng Trợ lý HR"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-4">
              <div className="grid gap-2" aria-live="polite">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {queryMutation.isPending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Đang tra cứu...
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              {questionsQuery.isLoading ? (
                <div className="grid gap-2" aria-label="Đang tải câu hỏi">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}

              {questionsQuery.isError ? (
                <div className="grid gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    Không thể tải danh sách câu hỏi.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit gap-2"
                    onClick={() => void questionsQuery.refetch()}
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Thử lại
                  </Button>
                </div>
              ) : null}

              {questionsQuery.isSuccess && questionsQuery.data.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  Hiện chưa có câu hỏi gợi ý.
                </p>
              ) : null}

              {questionsQuery.isSuccess && questionsQuery.data.length > 0 ? (
                <QuestionSuggestions
                  questions={questionsQuery.data}
                  disabled={queryMutation.isPending}
                  onSelect={(question) => void handleQuestionSelect(question)}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
