import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getMyPayrolls } from "../api/payroll.api";
import { payrollQueryKeys } from "../lib/payroll.query-keys";
import type { EmployeePayrollsQueryParams } from "../types/payroll.types";

export function useEmployeePayrollsQuery(params: EmployeePayrollsQueryParams) {
    return useQuery({
        queryKey: payrollQueryKeys.employeeList(params),
        queryFn: () => getMyPayrolls(params),
        placeholderData: keepPreviousData,
    });
}
