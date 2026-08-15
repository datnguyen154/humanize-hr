import { useMutation } from '@tanstack/react-query'

import { previewEmployeeImport } from '../api/employee.api'

export function usePreviewEmployeeImportMutation() {
  return useMutation({
    mutationFn: (file: File) => previewEmployeeImport(file),
  })
}
