import type {
    EmployeePayrollsQueryParams,
    PayrollsQueryParams,
} from "../types/payroll.types";

export const payrollQueryKeys = {
    all: ["payrolls"] as const,
    lists: () => [...payrollQueryKeys.all, "list"] as const,
    list: (params: PayrollsQueryParams) =>
        [...payrollQueryKeys.lists(), params] as const,
    employeeLists: () => [...payrollQueryKeys.all, "employee-list"] as const,
    employeeList: (params: EmployeePayrollsQueryParams) =>
        [...payrollQueryKeys.employeeLists(), params] as const,
};
