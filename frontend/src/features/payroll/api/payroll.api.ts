import { axiosInstance } from "@/shared/api";

import type {
    CreatePayrollRequest,
    CreatePayrollResponse,
    PayrollsQueryParams,
    PayrollsResponse,
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
