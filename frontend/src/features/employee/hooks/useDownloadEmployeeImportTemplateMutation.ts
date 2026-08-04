import { useMutation } from '@tanstack/react-query'

import { downloadEmployeeImportTemplate } from '../api/employee.api'

export function useDownloadEmployeeImportTemplateMutation() {
  return useMutation({
    mutationFn: downloadEmployeeImportTemplate,
  })
}
