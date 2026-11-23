import { QueryClient } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosInstance } from '@/shared/api'
import * as api from '@/features/work-schedule/api/calendar-exception.api'
import { parseCalendarExceptionError } from '@/features/work-schedule/lib/calendar-exception.helpers'
import { holidayFormSchema } from '@/features/work-schedule/lib/calendar-exception.schema'
import { holidayPresetQueryKeys } from '@/features/work-schedule/lib/work-calendar.query-keys'
import { invalidateCalendarMutation } from '@/features/work-schedule/lib/work-calendar.cache'
import type {
  HolidayPresetCatalog,
  HolidayBatchPlan,
  BatchPreviewRequest,
  BatchCommitRequest,
  BatchCommitResponse,
} from '@/features/work-schedule/types/calendar-exception.types'

vi.mock('@/shared/api', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const versionId = '11111111-1111-4111-8111-111111111111'

const mockCatalog: HolidayPresetCatalog = {
  catalogVersion: 'VN-2026-10-22-r1',
  year: 2026,
  timezone: 'Asia/Ho_Chi_Minh',
  requiresConfirmation: true,
  presets: [
    {
      id: 'VN-2026-10-22-r1:2026:NEW_YEAR:default',
      year: 2026,
      holidayCode: 'NEW_YEAR',
      name: 'Tết Dương lịch 2026',
      dates: ['2026-01-01'],
      sourceReference: 'Bộ luật Lao động 45/2019/QH14 Điều 112',
      sourceUrls: ['https://chinhphu.vn'],
      suggestedReason: 'Nghỉ Tết Dương lịch theo Điều 112 Bộ luật Lao động',
      verifiedOn: '2026-10-22',
    },
    {
      id: 'VN-2026-10-22-r1:2026:LUNAR_NEW_YEAR:opt1',
      year: 2026,
      holidayCode: 'LUNAR_NEW_YEAR',
      name: 'Tết Âm lịch 2026',
      optionLabel: 'Phương án 1 ngày trước Tết, 4 ngày sau Tết',
      dates: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'],
      sourceReference: 'Thông báo lịch 2026 qua Báo Chính phủ',
      sourceUrls: ['https://baochinhphu.vn'],
      suggestedReason: 'Nghỉ Tết Âm lịch 2026 theo phương án doanh nghiệp',
      verifiedOn: '2026-10-22',
    },
  ],
  unavailable: [
    {
      holidayCode: 'HUNG_KINGS',
      reason: 'Chưa có thông báo xác minh cho năm này',
    },
  ],
  notice: 'Danh mục tiện ích tĩnh, HR tự chịu trách nhiệm đối chiếu.',
}

const mockPlan: HolidayBatchPlan = {
  scheduleRevision: 3,
  catalogVersion: 'VN-2026-10-22-r1',
  planFingerprint: 'sha256:abc123mockfingerprint',
  toCreate: [
    {
      kind: 'HOLIDAY',
      date: '2026-01-01',
      name: 'Tết Dương lịch 2026',
      sourceReference: 'Bộ luật Lao động 45/2019/QH14 Điều 112',
      reason: 'Nghỉ Tết Dương lịch theo Điều 112 Bộ luật Lao động',
      holidayPolicy: {
        category: 'STATUTORY',
        presetId: 'VN-2026-10-22-r1:2026:NEW_YEAR:default',
      },
    },
  ],
  skipped: [],
  calendarDays: [
    {
      date: '2026-01-01',
      weekday: 4,
      dayType: 'HOLIDAY',
      isBaseWeeklyOff: false,
      isWorkingDay: false,
      shift: null,
      requiredWorkingMinutes: 0,
      scheduleVersionId: versionId,
      exceptionIds: [],
      holidayCategory: 'STATUTORY',
      holidayPayPolicy: 'PAID',
    },
  ],
  validation: {
    hasBlockingIssues: false,
    issues: [],
  },
}

describe('S2A Holiday Presets and Batch Exceptions Contract v1.1', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('GET holiday-presets fetches presets with 4-digit year and unwraps data', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { data: mockCatalog } })
    const result = await api.getHolidayPresets(2026)
    expect(result).toEqual(mockCatalog)
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/work-calendar/holiday-presets',
      expect.objectContaining({ params: { year: '2026' } }),
    )
  })

  it('POST batch-preview sends expectedRevision, includeCompensatoryOff, holidays and unwraps plan', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: { data: mockPlan } })
    const request: BatchPreviewRequest = {
      expectedRevision: 3,
      includeCompensatoryOff: true,
      holidays: [
        {
          kind: 'HOLIDAY',
          date: '2026-01-01',
          name: 'Tết Dương lịch 2026',
          sourceReference: 'Điều 112',
          reason: 'Nghỉ lễ',
          holidayPolicy: {
            category: 'STATUTORY',
            presetId: 'VN-2026-10-22-r1:2026:NEW_YEAR:default',
          },
        },
      ],
    }

    const result = await api.previewHolidayBatch(versionId, request)
    expect(result).toEqual(mockPlan)
    expect(axiosInstance.post).toHaveBeenCalledWith(
      `/work-calendar/versions/${versionId}/exceptions/batch-preview`,
      request,
      expect.anything(),
    )
  })

  it('POST batch commits atomically with planFingerprint and unwraps commit response', async () => {
    const commitResponse: BatchCommitResponse = {
      data: { created: [], skipped: [], scheduleRevision: 4 },
    }
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: commitResponse })
    const request: BatchCommitRequest = {
      expectedRevision: 3,
      planFingerprint: 'sha256:abc123mockfingerprint',
      includeCompensatoryOff: true,
      holidays: [
        {
          kind: 'HOLIDAY',
          date: '2026-01-01',
          name: 'Tết Dương lịch 2026',
          sourceReference: 'Điều 112',
          reason: 'Nghỉ lễ',
          holidayPolicy: {
            category: 'STATUTORY',
            presetId: 'VN-2026-10-22-r1:2026:NEW_YEAR:default',
          },
        },
      ],
    }

    const result = await api.commitHolidayBatch(versionId, request)
    expect(result).toEqual(commitResponse.data)
    expect(axiosInstance.post).toHaveBeenCalledWith(
      `/work-calendar/versions/${versionId}/exceptions/batch`,
      request,
      expect.anything(),
    )
  })

  it('holidayFormSchema validates statutory presets and explicit company isPaid', () => {
    // 1. STATUTORY requires presetId
    const statutoryWithoutPreset = holidayFormSchema.safeParse({
      kind: 'HOLIDAY',
      holidayCategory: 'STATUTORY',
      presetId: '',
      date: '2026-01-01',
      name: 'Tết Dương lịch',
      sourceReference: 'Điều 112',
      reason: 'Nghỉ lễ',
    })
    expect(statutoryWithoutPreset.success).toBe(false)
    if (!statutoryWithoutPreset.success) {
      expect(statutoryWithoutPreset.error.issues[0]?.message).toBe(
        'Vui lòng chọn mẫu ngày lễ pháp định.',
      )
    }

    const statutoryWithPreset = holidayFormSchema.safeParse({
      kind: 'HOLIDAY',
      holidayCategory: 'STATUTORY',
      presetId: 'VN-2026-10-22-r1:2026:NEW_YEAR:default',
      date: '2026-01-01',
      name: 'Tết Dương lịch',
      sourceReference: 'Điều 112',
      reason: 'Nghỉ lễ',
    })
    expect(statutoryWithPreset.success).toBe(true)

    // 2. COMPANY requires explicit isPaid boolean
    const companyWithoutPaid = holidayFormSchema.safeParse({
      kind: 'HOLIDAY',
      holidayCategory: 'COMPANY',
      isPaid: undefined,
      date: '2026-06-01',
      name: 'Ngày thành lập công ty',
      sourceReference: 'Quyết định 45/QĐ-CT',
      reason: 'Kỷ niệm thành lập',
    })
    expect(companyWithoutPaid.success).toBe(false)
    if (!companyWithoutPaid.success) {
      expect(companyWithoutPaid.error.issues[0]?.message).toBe(
        'Vui lòng chọn rõ ngày nghỉ này có hưởng lương hay không.',
      )
    }

    const companyWithPaid = holidayFormSchema.safeParse({
      kind: 'HOLIDAY',
      holidayCategory: 'COMPANY',
      isPaid: true,
      date: '2026-06-01',
      name: 'Ngày thành lập công ty',
      sourceReference: 'Quyết định 45/QĐ-CT',
      reason: 'Kỷ niệm thành lập',
    })
    expect(companyWithPaid.success).toBe(true)

    // 3. UNCLASSIFIED or missing policy maintains backward compatibility
    const legacyHoliday = holidayFormSchema.safeParse({
      kind: 'HOLIDAY',
      holidayCategory: 'UNCLASSIFIED',
      date: '2026-11-20',
      name: 'Ngày Nhà giáo',
      sourceReference: 'Quyết định 123',
      reason: 'Tri ân thầy cô',
    })
    expect(legacyHoliday.success).toBe(true)
  })

  it('parses S2A batch error codes into clear Vietnamese messages', () => {
    const makeError = (code: string) => {
      const err = new AxiosError('Batch error')
      err.response = { status: 409, data: { code, message: 'raw' } } as AxiosResponse
      return err
    }

    expect(parseCalendarExceptionError(makeError('WORK_CALENDAR_BATCH_PLAN_CHANGED')).message).toContain(
      'Kế hoạch kỳ nghỉ đã thay đổi',
    )
    expect(parseCalendarExceptionError(makeError('WORK_CALENDAR_BATCH_UNRESOLVED')).message).toContain(
      'Chưa xác định được ngày nghỉ bù hợp lệ',
    )
    expect(parseCalendarExceptionError(makeError('WORK_CALENDAR_PRESET_NOT_FOUND')).message).toContain(
      'Mẫu ngày lễ không tồn tại',
    )
    expect(parseCalendarExceptionError(makeError('WORK_CALENDAR_PRESET_OPTION_CONFLICT')).message).toContain(
      'Không được chọn nhiều phương án',
    )
    expect(parseCalendarExceptionError(makeError('WORK_CALENDAR_HOLIDAY_POLICY_INVALID')).message).toContain(
      'Chính sách ngày nghỉ không hợp lệ',
    )
  })

  it('query key for holiday presets contains year', () => {
    expect(holidayPresetQueryKeys.byYear(2026)).toEqual(['holiday-presets', 2026])
  })

  it('invalidates calendar exceptions and preview after batch commit, not Attendance/Payroll', async () => {
    const client = new QueryClient()
    const expKey = ['calendar-exception', 'list', versionId]
    const prevKey = ['calendar-preview', 'preview', versionId, 2026, 1]
    const payrollKey = ['payroll-records']
    const attendanceKey = ['attendance-records']

    client.setQueryData(expKey, { data: [] })
    client.setQueryData(prevKey, { data: {} })
    client.setQueryData(payrollKey, { data: [] })
    client.setQueryData(attendanceKey, { data: [] })

    await invalidateCalendarMutation(client, versionId)

    expect(client.getQueryState(expKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(prevKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(payrollKey)?.isInvalidated).toBe(false)
    expect(client.getQueryState(attendanceKey)?.isInvalidated).toBe(false)
    client.clear()
  })
})
