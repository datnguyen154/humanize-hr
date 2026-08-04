import { useMutation, useQueryClient } from '@tanstack/react-query'

import { importEmployees } from '../api/employee.api'
import { employeeQueryKeys } from '../lib/employee.query-keys'

export function useImportEmployeesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importEmployees(file),
    onSuccess: (result) => {
      if (result.successCount > 0) {
        void queryClient.invalidateQueries({
          queryKey: employeeQueryKeys.all,
        })
      }
    },
  })
}
