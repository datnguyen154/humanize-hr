import { useMutation } from "@tanstack/react-query";

import { downloadEmployeePayrollPdf } from "../api/payroll.api";

export function useDownloadEmployeePayrollPdfMutation() {
    return useMutation({
        mutationFn: (id: string) => downloadEmployeePayrollPdf(id),
    });
}
