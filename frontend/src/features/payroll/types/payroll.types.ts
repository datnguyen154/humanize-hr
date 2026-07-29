export type PayrollStatus = "DRAFT" | "PUBLISHED";

export type PayrollSortBy =
    | "baseSalary"
    | "bonus"
    | "deduction"
    | "netSalary"
    | "month"
    | "year"
    | "createdAt";

export type PayrollSortOrder = "asc" | "desc";

export type PayrollEmployee = {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
};

export type Payroll = {
    id: string;
    employeeId: string;
    employee: PayrollEmployee;
    month: number;
    year: number;
    baseSalary: string;
    bonus: string;
    deduction: string;
    netSalary: string;
    note: string | null;
    status: PayrollStatus;
    createdAt: string;
    updatedAt: string;
};

export type EmployeePayroll = Omit<Payroll, "employeeId" | "employee"> & {
    status: Extract<PayrollStatus, "PUBLISHED">;
};

export type CreatePayrollRequest = {
    employeeId: string;
    month: number;
    year: number;
    baseSalary: number | string;
    bonus?: number | string;
    deduction?: number | string;
    note?: string | null;
};

export type UpdatePayrollRequest = {
    baseSalary?: number;
    bonus?: number;
    deduction?: number;
    note?: string | null;
};

export type PayrollMutationResult = Omit<Payroll, "employee">;

export type PayrollsQueryParams = {
    page: number;
    limit: number;
    search?: string;
    month?: number;
    year?: number;
    sortBy?: PayrollSortBy;
    sortOrder?: PayrollSortOrder;
};

export type EmployeePayrollsQueryParams = {
    page: number;
    limit: number;
    month?: number;
    year?: number;
};

export type PayrollsPagination = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

export type PayrollsResponse = {
    data: Payroll[];
    pagination: PayrollsPagination;
};

export type EmployeePayrollsResponse = {
    data: EmployeePayroll[];
    pagination: PayrollsPagination;
};

export type PayrollPdfDownloadResult = {
    blob: Blob;
    contentDisposition?: string;
};

export type CreatePayrollResponse = {
    data: PayrollMutationResult;
};

export type UpdatePayrollResponse = {
    data: PayrollMutationResult;
};

export type PublishPayrollResponse = {
    data: PayrollMutationResult;
};
