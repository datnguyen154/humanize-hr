import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { importEmployees, previewEmployeeImport, downloadEmployeeImportTemplate } from '@/features/employee/api/employee.api'
import { employeeQueryKeys } from '@/features/employee/lib/employee.query-keys'
import type { EmployeeImportPreviewResult, ImportEmployeesResult } from '@/features/employee/types/employee.types'
import { ImportEmployeesDialog } from '@/pages/admin/employees/components/ImportEmployeesDialog'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast'

vi.mock('@/features/employee/api/employee.api', () => ({
  importEmployees: vi.fn(), previewEmployeeImport: vi.fn(), downloadEmployeeImportTemplate: vi.fn(),
}))
vi.mock('@/lib/toast', () => ({ showErrorToast: vi.fn(), showInfoToast: vi.fn(), showSuccessToast: vi.fn() }))

const workbook = () => new File(['test workbook'], 'employees.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
})

function preview(validCount = 1, invalidCount = 0): EmployeeImportPreviewResult {
  return {
    totalRows: validCount + invalidCount, validCount, invalidCount,
    rows: Array.from({ length: validCount + invalidCount }, (_, index) => ({
      rowNumber: index + 2, employeeCode: `EMP${index + 1}`, fullName: `Nhân viên ${index + 1}`,
      email: `employee${index + 1}@example.com`, phone: null, position: 'Developer',
      department: null, status: 'ACTIVE', joinedAt: '2026-01-01', valid: index < validCount,
      errors: index < validCount ? [] : [{ field: 'email', message: 'Email already exists' }],
    })),
  }
}

function result(successCount: number, failedCount: number): ImportEmployeesResult {
  return {
    totalRows: successCount + failedCount, successCount, failedCount,
    createdEmployees: Array.from({ length: successCount }, (_, index) => ({
      rowNumber: index + 2, id: `employee-${index}`, employeeCode: `EMP${index}`, fullName: `Nhân viên ${index}`,
    })),
    errors: failedCount ? [{ rowNumber: successCount + 2, field: 'email', message: 'Email already exists' }] : [],
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

function DialogHarness() {
  const [open, setOpen] = useState(true)
  return <><button onClick={() => setOpen(true)}>Mở lại</button><ImportEmployeesDialog open={open} onOpenChange={setOpen} /></>
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const listKey = employeeQueryKeys.list({ page: 1, limit: 10 })
  client.setQueryData(listKey, { data: [], meta: {} })
  client.setQueryData(['departments'], [])
  render(<QueryClientProvider client={client}><DialogHarness /></QueryClientProvider>)
  return { client, listKey }
}

const fileInput = () => screen.getByLabelText('Chọn file Excel nhập nhân viên') as HTMLInputElement
const chooseFile = (file = workbook()) => fireEvent.change(fileInput(), { target: { files: [file] } })

async function showPreview(data = preview()) {
  vi.mocked(previewEmployeeImport).mockResolvedValueOnce(data)
  chooseFile()
  fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu' }))
  await screen.findByRole('button', { name: `Nhập ${data.validCount} nhân viên hợp lệ` })
}

describe('Employee Excel Import interaction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('rejects unsupported file extension and files larger than 5 MB before preview', () => {
    setup()
    chooseFile(new File(['data'], 'employees.csv'))
    expect(screen.getByText('Vui lòng chọn file Excel định dạng .xlsx.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Xem trước dữ liệu' }) as HTMLButtonElement).disabled).toBe(true)
    const largeFile = workbook()
    Object.defineProperty(largeFile, 'size', { value: 5 * 1024 * 1024 + 1 })
    chooseFile(largeFile)
    expect(screen.getByText('File Excel vượt quá giới hạn 5 MB.')).toBeTruthy()
    expect(previewEmployeeImport).not.toHaveBeenCalled()
  })

  it.each([[1, 0], [1, 1], [0, 1]])('allows replacing preview with %i valid and %i invalid rows', async (valid, invalid) => {
    setup()
    await showPreview(preview(valid, invalid))
    const input = fileInput()
    expect(input.isConnected).toBe(true)
    const confirm = screen.getByRole('button', { name: `Nhập ${valid} nhân viên hợp lệ` }) as HTMLButtonElement
    expect(confirm.disabled).toBe(valid === 0)
    const click = vi.spyOn(input, 'click')
    Object.defineProperty(input, 'value', { configurable: true, writable: true, value: 'C:\\fakepath\\employees.xlsx' })
    fireEvent.click(screen.getByRole('button', { name: 'Chọn file khác' }))
    expect(click).toHaveBeenCalledOnce()
    expect(input.value).toBe('')
    const revisedFile = workbook()
    chooseFile(revisedFile)
    expect(screen.queryByRole('button', { name: /Nhập \d+ nhân viên hợp lệ/ })).toBeNull()
    expect((screen.getByRole('button', { name: 'Xem trước dữ liệu' }) as HTMLButtonElement).disabled).toBe(false)
    vi.mocked(previewEmployeeImport).mockResolvedValueOnce(preview())
    fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu' }))
    await screen.findByRole('button', { name: 'Nhập 1 nhân viên hợp lệ' })
    expect(previewEmployeeImport).toHaveBeenLastCalledWith(revisedFile)
    expect(importEmployees).not.toHaveBeenCalled()
  })

  it.each([[1, 0], [1, 1], [0, 1]])('keeps result and invalidates only when %i rows succeeded (%i failed)', async (success, failed) => {
    const { client, listKey } = setup()
    await showPreview(preview(1, failed))
    vi.mocked(importEmployees).mockResolvedValueOnce(result(success, failed))
    fireEvent.click(screen.getByRole('button', { name: /Nhập \d+ nhân viên hợp lệ/ }))
    await screen.findByRole('heading', { name: 'Kết quả nhập dữ liệu' })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Nhập \d+ nhân viên hợp lệ/ })).toBeNull()
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(success > 0)
    expect(client.getQueryState(['departments'])?.isInvalidated).toBe(false)
    expect(importEmployees).toHaveBeenCalledOnce()
    if (failed) expect(screen.getAllByText('Email already exists').length).toBeGreaterThan(0)
    if (success && !failed) expect(showSuccessToast).toHaveBeenCalledOnce()
    else if (success) expect(showInfoToast).toHaveBeenCalledOnce()
    else expect(showErrorToast).toHaveBeenCalledOnce()
    const input = fileInput()
    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Chọn file khác' }))
    expect(click).toHaveBeenCalledOnce()
    chooseFile()
    expect(screen.queryByText('Email already exists')).toBeNull()
    expect(screen.getByRole('button', { name: 'Xem trước dữ liệu' })).toBeTruthy()
    client.clear()
  })

  it('locks file replacement, cancel and repeated preview while preview is pending', async () => {
    setup()
    const pending = deferred<EmployeeImportPreviewResult>()
    vi.mocked(previewEmployeeImport).mockReturnValueOnce(pending.promise)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu' }))
    await waitFor(() => expect(fileInput().disabled).toBe(true))
    for (const name of ['Đổi file', 'Hủy']) {
      expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Đang kiểm tra...' }))
    expect(previewEmployeeImport).toHaveBeenCalledOnce()
    await act(async () => pending.resolve(preview()))
    await screen.findByRole('button', { name: 'Nhập 1 nhân viên hợp lệ' })
    expect(fileInput().disabled).toBe(false)
  })

  it('locks confirm and replacement while import is pending and sends once', async () => {
    setup()
    await showPreview()
    const pending = deferred<ImportEmployeesResult>()
    vi.mocked(importEmployees).mockReturnValueOnce(pending.promise)
    fireEvent.click(screen.getByRole('button', { name: 'Nhập 1 nhân viên hợp lệ' }))
    const confirm = await screen.findByRole('button', { name: 'Đang nhập dữ liệu...' }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.click(confirm)
    expect((screen.getByRole('button', { name: 'Chọn file khác' }) as HTMLButtonElement).disabled).toBe(true)
    expect(fileInput().disabled).toBe(true)
    expect(importEmployees).toHaveBeenCalledOnce()
    await act(async () => pending.resolve(result(1, 0)))
    await screen.findByRole('heading', { name: 'Kết quả nhập dữ liệu' })
  })

  it('clears preview error when a revised file is selected', async () => {
    setup()
    vi.mocked(previewEmployeeImport).mockRejectedValueOnce(new Error('Network failed'))
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu' }))
    await screen.findByText('Không thể xem trước file Excel. Vui lòng kiểm tra file và thử lại.')
    chooseFile()
    expect(screen.queryByRole('button', { name: 'Thử lại xem trước' })).toBeNull()
  })

  it('keeps preview on import failure, permits retry and does not invalidate cache', async () => {
    const { client, listKey } = setup()
    await showPreview()
    vi.mocked(importEmployees).mockRejectedValueOnce(new Error('Network failed')).mockResolvedValueOnce(result(1, 0))
    fireEvent.click(screen.getByRole('button', { name: 'Nhập 1 nhân viên hợp lệ' }))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('Không thể nhập danh sách nhân viên. Vui lòng thử lại sau.', 'Nhập Excel thất bại'))
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Nhập 1 nhân viên hợp lệ' }))
    await screen.findByRole('heading', { name: 'Kết quả nhập dữ liệu' })
    expect(importEmployees).toHaveBeenCalledTimes(2)
    client.clear()
  })

  it('resets file and preview after closing and reopening', async () => {
    setup()
    await showPreview()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mở lại' }))
    expect(screen.getByText('Chưa chọn file')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Xem trước dữ liệu' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('downloads the template through the existing API and releases the object URL', async () => {
    setup()
    const blob = new Blob(['template'])
    vi.mocked(downloadEmployeeImportTemplate).mockResolvedValueOnce({ blob, contentDisposition: 'attachment; filename="employees-template.xlsx"' })
    const createUrl = vi.fn(() => 'blob:test-template')
    const revokeUrl = vi.fn()
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createUrl
      static revokeObjectURL = revokeUrl
    })
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Tải file mẫu' }))
      await waitFor(() => expect(download).toHaveBeenCalledOnce())
      expect(createUrl).toHaveBeenCalledWith(blob)
      expect(revokeUrl).toHaveBeenCalledWith('blob:test-template')
    } finally { vi.unstubAllGlobals() }
  })
})
