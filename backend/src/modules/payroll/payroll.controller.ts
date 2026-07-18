import type { Request, Response } from "express";

import { PayrollServiceError, payrollService } from "./payroll.service";
import type { PayrollSortBy, PayrollSortOrder } from "./payroll.repository";

const allowedSortBy: PayrollSortBy[] = [
    "baseSalary",
    "bonus",
    "deduction",
    "netSalary",
    "month",
    "year",
    "createdAt",
];

const allowedSortOrder: PayrollSortOrder[] = ["asc", "desc"];

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const parseSortBy = (value: unknown): PayrollSortBy | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (allowedSortBy.includes(sortBy as PayrollSortBy)) {
        return sortBy as PayrollSortBy;
    }

    throw new PayrollServiceError("Invalid sortBy", 400);
};

const parseSortOrder = (value: unknown): PayrollSortOrder | undefined => {
    const sortOrder = getSingleQueryValue(value);

    if (!sortOrder) {
        return undefined;
    }

    if (allowedSortOrder.includes(sortOrder as PayrollSortOrder)) {
        return sortOrder as PayrollSortOrder;
    }

    throw new PayrollServiceError("Invalid sortOrder", 400);
};

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
    async getPayrolls(req: Request, res: Response): Promise<Response> {
        try {
            const result = await payrollService.getPayrolls({
                page: getSingleQueryValue(req.query.page),
                limit: getSingleQueryValue(req.query.limit),
                search: getSingleQueryValue(req.query.search),
                month: getSingleQueryValue(req.query.month),
                year: getSingleQueryValue(req.query.year),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

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
