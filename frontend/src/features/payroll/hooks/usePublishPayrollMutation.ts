import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publishPayroll } from "../api/payroll.api";
import { payrollQueryKeys } from "../lib/payroll.query-keys";

export function usePublishPayrollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => publishPayroll(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: payrollQueryKeys.all,
            });
        },
    });
}
