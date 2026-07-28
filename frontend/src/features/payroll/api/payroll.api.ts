import { axiosInstance } from "@/shared/api";

import type {
    CreatePayrollRequest,
    CreatePayrollResponse,
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

export const createPayroll = async (payload: CreatePayrollRequest) => {
    const response = await axiosInstance.post<CreatePayrollResponse>(
        "/payrolls",
        payload,
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
