import type { Request, Response } from "express";

import { PayrollServiceError, payrollService } from "./payroll.service";

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof PayrollServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const payrollController = {
    async createPayroll(req: Request, res: Response): Promise<Response> {
        try {
            const {
                employeeId,
                month,
                year,
                baseSalary,
                bonus,
                deduction,
                note,
            } = req.body as {
                employeeId?: unknown;
                month?: unknown;
                year?: unknown;
                baseSalary?: unknown;
                bonus?: unknown;
                deduction?: unknown;
                note?: unknown;
            };

            const payroll = await payrollService.createPayroll({
                employeeId,
                month,
                year,
                baseSalary,
                bonus,
                deduction,
                note,
            });

            return res.status(201).json({
                data: payroll,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
