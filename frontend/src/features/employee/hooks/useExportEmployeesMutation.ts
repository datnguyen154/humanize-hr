import { useMutation } from '@tanstack/react-query'

import { exportEmployees } from '../api/employee.api'
import type { ExportEmployeesParams } from '../types/employee.types'

export function useExportEmployeesMutation() {
  return useMutation({
    mutationFn: (params: ExportEmployeesParams) => exportEmployees(params),
  })
}
