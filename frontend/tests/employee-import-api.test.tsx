import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { importEmployees, previewEmployeeImport } from '@/features/employee/api/employee.api'
import { authStorage } from '@/features/auth/model/auth.storage'
import { axiosInstance } from '@/shared/api/axios'

describe('Employee import multipart request', () => {
  it.each([
    { action: importEmployees, path: '/employees/import', data: { totalRows: 1, successCount: 1, failedCount: 0, createdEmployees: [], errors: [] } },
    { action: previewEmployeeImport, path: '/employees/import-preview', data: { totalRows: 1, validCount: 1, invalidCount: 0, rows: [] } },
  ])('sends FormData file with bearer token to $path and unwraps response', async ({ action, path, data }) => {
    const originalAdapter = axiosInstance.defaults.adapter
    const originalToken = authStorage.getAccessToken()
    const captured: InternalAxiosRequestConfig[] = []
    const file = new File(['workbook'], 'employees.xlsx')
    authStorage.setAccessToken('test-access-token')
    axiosInstance.defaults.adapter = vi.fn(async (config) => {
      captured.push(config)
      return { data: { data }, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
    })
    try {
      expect(await action(file)).toEqual(data)
      expect(captured).toHaveLength(1)
      const request = captured[0]
      expect(request.url).toBe(path)
      expect(request.method).toBe('post')
      expect(request.data).toBeInstanceOf(FormData)
      expect(request.data.get('file')).toBe(file)
      expect([...request.data.keys()]).toEqual(['file'])
      expect(request.headers.get('Authorization')).toBe('Bearer test-access-token')
      expect(request.headers.get('Content-Type')).not.toContain('application/json')
    } finally {
      axiosInstance.defaults.adapter = originalAdapter
      if (originalToken) authStorage.setAccessToken(originalToken)
      else authStorage.clearTokens()
    }
  })
})
