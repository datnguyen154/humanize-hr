import { axiosInstance } from "@/shared/api";

import type {
    CreatePayrollRequest,
    CreatePayrollResponse,
    EmployeePayrollsQueryParams,
    EmployeePayrollsResponse,
    PayrollPdfDownloadResult,
    PublishPayrollResponse,
    PayrollsQueryParams,
    PayrollsResponse,
    UpdatePayrollRequest,
    UpdatePayrollResponse,
} from "../types/payroll.types";

export const getPayrolls = async (params: PayrollsQueryParams) => {
    const response = await axiosInstance.get<PayrollsResponse>("/payrolls", {
        params,
    });

    return response.data;
};

export const getMyPayrolls = async (params: EmployeePayrollsQueryParams) => {
    const response = await axiosInstance.get<EmployeePayrollsResponse>(
        "/employees/me/payrolls",
        {
            params,
        },
    );

    return response.data;
};

export const downloadEmployeePayrollPdf = async (
    id: string,
): Promise<PayrollPdfDownloadResult> => {
    const response = await axiosInstance.get<Blob>(
        `/employees/me/payrolls/${id}/pdf`,
        {
            responseType: "blob",
        },
    );
    const contentDisposition = response.headers["content-disposition"];

    return {
        blob: response.data,
        contentDisposition:
            typeof contentDisposition === "string"
                ? contentDisposition
                : undefined,
    };
};

export const createPayroll = async (payload: CreatePayrollRequest) => {
    const response = await axiosInstance.post<CreatePayrollResponse>(
        "/payrolls",
        payload,
    );

    return response.data.data;
};

export const publishPayroll = async (id: string) => {
    const response = await axiosInstance.patch<PublishPayrollResponse>(
        `/payrolls/${id}/publish`,
    );

    return response.data.data;
};

export const updatePayroll = async (
    id: string,
    payload: UpdatePayrollRequest,
) => {
    const response = await axiosInstance.patch<UpdatePayrollResponse>(
        `/payrolls/${id}`,
        payload,
    );

    return response.data.data;
};
