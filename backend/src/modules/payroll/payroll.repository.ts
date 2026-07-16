import type { Payroll, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type CreatePayrollData = Prisma.PayrollUncheckedCreateInput;

export const payrollRepository = {
    findPayrollByEmployeeMonthYear(
        employeeId: string,
        month: number,
        year: number,
    ): Promise<Payroll | null> {
        return prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month,
                    year,
                },
            },
        });
    },

    createPayroll(data: CreatePayrollData): Promise<Payroll> {
        return prisma.payroll.create({
            data,
        });
    },
};
