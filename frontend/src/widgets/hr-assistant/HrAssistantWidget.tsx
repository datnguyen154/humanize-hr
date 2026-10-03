import { AxiosError } from 'axios'
import {
  Bot, Building2, CalendarDays, ChevronRight, Clock3, Loader2,
  MessageCircle, RefreshCw, UserRound, Wallet, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  useHrAssistantQuestionsQuery,
  useHrAssistantQueryMutation,
  type HrAssistantAudience,
  type HrAssistantMessage,
  type HrAssistantQuestion,
} from '@/features/hr-assistant'

const GREETING = 'Bạn cần tra cứu gì?'

const employeeTopics = [
  { label: 'Chấm công', icon: Clock3, keys: ['TODAY_ATTENDANCE_STATUS', 'TODAY_LATE_STATUS', 'CURRENT_MONTH_LATE_COUNT', 'WHERE_TO_VIEW_ATTENDANCE'] },
  { label: 'Nghỉ phép', icon: CalendarDays, keys: ['LATEST_LEAVE_REQUEST', 'HOW_TO_REQUEST_LEAVE'] },
  { label: 'Bảng lương', icon: Wallet, keys: ['LATEST_PAYROLL', 'WHERE_TO_VIEW_PAYROLL'] },
  { label: 'Hồ sơ', icon: UserRound, keys: ['MY_DEPARTMENT'] },
]
const employeePopularKeys = ['TODAY_ATTENDANCE_STATUS', 'LATEST_PAYROLL', 'LATEST_LEAVE_REQUEST']
const adminTopics = [
  { label: 'Nhân viên', icon: UserRound, keys: ['ADMIN_TOTAL_EMPLOYEES', 'ADMIN_ACTIVE_EMPLOYEES', 'ADMIN_INACTIVE_EMPLOYEES'] },
  { label: 'Phòng ban', icon: Building2, keys: ['ADMIN_TOTAL_DEPARTMENTS', 'ADMIN_ACTIVE_DEPARTMENTS'] },
  { label: 'Chấm công', icon: Clock3, keys: ['ADMIN_TODAY_ATTENDANCE', 'ADMIN_TODAY_LATE'] },
  { label: 'Nghỉ phép', icon: CalendarDays, keys: ['ADMIN_PENDING_LEAVE', 'ADMIN_TOTAL_LEAVE'] },
]
const adminPopularKeys = ['ADMIN_TOTAL_EMPLOYEES', 'ADMIN_TODAY_ATTENDANCE', 'ADMIN_PENDING_LEAVE']

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

const getAssistantErrorMessage = (error: unknown, audience: HrAssistantAudience) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) {
      return audience === 'admin'
        ? 'Không tìm thấy dữ liệu tra cứu. Vui lòng thử lại sau.'
        : 'Không tìm thấy hồ sơ nhân viên của bạn.'
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
        className={`max-w-[88%] rounded-lg px-3 py-2.5 text-sm leading-6 ${
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
  audience,
  questions,
  disabled,
  onSelect,
}: {
  audience: HrAssistantAudience
  questions: HrAssistantQuestion[]
  disabled: boolean
  onSelect: (question: HrAssistantQuestion) => void
}) {
  const [topicIndex, setTopicIndex] = useState<number | null>(null)
  const topics = audience === 'admin' ? adminTopics : employeeTopics
  const popularKeys = audience === 'admin' ? adminPopularKeys : employeePopularKeys
  const visibleQuestions = questions.filter((question) => topicIndex === null
    ? popularKeys.includes(question.key) || !topics.some((topic) => topic.keys.includes(question.key))
    : topics[topicIndex].keys.includes(question.key))

  return (
    <section className="grid gap-3" aria-labelledby="hr-assistant-suggestions">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chủ đề tra cứu">
        {topics.map((topic, index) => (
          <Button
            key={topic.label}
            type="button"
            variant={topicIndex === index ? 'secondary' : 'outline'}
            className="h-9 justify-start px-3 text-xs"
            aria-pressed={topicIndex === index}
            onClick={() => setTopicIndex(topicIndex === index ? null : index)}
          >
            <topic.icon className="size-4 text-primary" aria-hidden="true" />
            {topic.label}
          </Button>
        ))}
      </div>
      <h3
        id="hr-assistant-suggestions"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {topicIndex === null ? 'Tra cứu thường dùng' : topics[topicIndex].label}
      </h3>
      <div className="grid divide-y divide-border">
        {visibleQuestions.map((question) => (
          <Button
            key={question.key}
            type="button"
            variant="ghost"
            disabled={disabled}
            className="h-auto min-h-12 justify-between whitespace-normal rounded-none px-1 py-3 text-left text-sm font-normal"
            onClick={() => onSelect(question)}
          >
            <span className="min-w-0 break-words">{question.label}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        ))}
      </div>
    </section>
  )
}

export function HrAssistantWidget({ audience = 'employee' }: { audience?: HrAssistantAudience }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<HrAssistantMessage[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [showQuestions, setShowQuestions] = useState(true)
  const [failure, setFailure] = useState<{ question: HrAssistantQuestion; message: string } | null>(null)
  const hasConversation = messages.length > 0
  const questionsQuery = useHrAssistantQuestionsQuery(open, audience)
  const queryMutation = useHrAssistantQueryMutation(audience)
  const requestPendingRef = useRef(false)

  useEffect(() => {
    const viewport = scrollRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [messages, queryMutation.isPending, failure, open])

  const appendMessage = (message: Omit<HrAssistantMessage, 'id'>) => {
    setMessages((current) => [...current, { id: createMessageId(), ...message }])
  }

  const handleQuestionSelect = async (question: HrAssistantQuestion, retry = false) => {
    if (requestPendingRef.current) return
    requestPendingRef.current = true
    setFailure(null)
    setShowQuestions(false)

    if (!retry) appendMessage({
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
      setFailure({ question, message: getAssistantErrorMessage(error, audience) })
    } finally {
      requestPendingRef.current = false
    }
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
        <Button
          type="button"
          className="size-12 gap-2 rounded-full p-0 shadow-lg sm:w-auto sm:px-4"
          aria-label="Mở Trợ lý HR"
          title="Trợ lý HR"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline">Trợ lý HR</span>
        </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={12} collisionPadding={12} aria-labelledby="hr-assistant-title" className="w-[min(400px,calc(100vw-2rem))] overflow-hidden shadow-xl">
        <Card
          className="flex h-[min(580px,calc(100dvh-6rem))] max-h-[var(--radix-popover-content-available-height)] w-full flex-col gap-0 overflow-hidden rounded-none border-0 py-0 shadow-none"
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
                  {audience === 'admin' ? 'Hỗ trợ quản trị nhân sự' : 'Tra cứu thông tin của bạn'}
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

          <CardContent ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="grid gap-4">
              {!hasConversation ? (
                <div className="pb-2 pt-1">
                  <h3 className="text-lg font-semibold">{GREETING}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {audience === 'admin'
                      ? 'Nhân viên, phòng ban, chấm công và nghỉ phép.'
                      : 'Chấm công, nghỉ phép và bảng lương cá nhân.'}
                  </p>
                </div>
              ) : null}
              <div className="grid gap-3" role="log" aria-label="Hội thoại với Trợ lý HR" aria-live="polite">
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
              </div>

              {failure ? (
                <div role="alert" className="rounded-lg border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{failure.message}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={queryMutation.isPending}
                    onClick={() => void handleQuestionSelect(failure.question, true)}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Thử lại
                  </Button>
                </div>
              ) : null}

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

              {!hasConversation && questionsQuery.isSuccess && questionsQuery.data.length > 0 ? (
                <QuestionSuggestions
                  audience={audience}
                  questions={questionsQuery.data}
                  disabled={queryMutation.isPending}
                  onSelect={(question) => void handleQuestionSelect(question)}
                />
              ) : null}
            </div>
          </CardContent>
          {hasConversation && questionsQuery.isSuccess ? (
            <footer className="flex max-h-[55%] min-h-0 shrink-0 flex-col border-t border-border">
              <Button
                type="button"
                variant="ghost"
                className="h-12 w-full shrink-0 justify-between rounded-none px-4"
                aria-expanded={showQuestions}
                aria-controls="hr-assistant-follow-up"
                onClick={() => setShowQuestions((value) => !value)}
              >
                Tra cứu tiếp
                <ChevronRight className={`size-4 ${showQuestions ? '-rotate-90' : 'rotate-90'}`} aria-hidden="true" />
              </Button>
              {showQuestions ? (
                <div id="hr-assistant-follow-up" className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
                  <QuestionSuggestions
                    audience={audience}
                    questions={questionsQuery.data}
                    disabled={queryMutation.isPending}
                    onSelect={(question) => void handleQuestionSelect(question)}
                  />
                </div>
              ) : null}
            </footer>
          ) : null}
        </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
