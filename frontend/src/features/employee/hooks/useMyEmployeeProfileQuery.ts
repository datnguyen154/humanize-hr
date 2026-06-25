import { useQuery } from '@tanstack/react-query'

import { getMyEmployeeProfile } from '../api/employee.api'
import { employeeQueryKeys } from '../lib/employee.query-keys'

export function useMyEmployeeProfileQuery() {
  return useQuery({
    queryKey: employeeQueryKeys.me(),
    queryFn: getMyEmployeeProfile,
  })
}
