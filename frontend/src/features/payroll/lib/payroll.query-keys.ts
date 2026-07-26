import type { PayrollsQueryParams } from "../types/payroll.types";

export const payrollQueryKeys = {
    all: ["payrolls"] as const,
    lists: () => [...payrollQueryKeys.all, "list"] as const,
    list: (params: PayrollsQueryParams) =>
        [...payrollQueryKeys.lists(), params] as const,
};
