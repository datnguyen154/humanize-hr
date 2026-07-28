import type { Payroll, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type CreatePayrollData = Prisma.PayrollUncheckedCreateInput;
export type UpdatePayrollData = Prisma.PayrollUncheckedUpdateInput;

export type PayrollSortBy =
    | "baseSalary"
    | "bonus"
    | "deduction"
    | "netSalary"
    | "month"
    | "year"
    | "createdAt";

export type PayrollSortOrder = "asc" | "desc";

export type PayrollQueryParams = {
    skip?: number;
    take?: number;
    search?: string;
    month?: number;
    year?: number;
    sortBy?: PayrollSortBy;
    sortOrder?: PayrollSortOrder;
};

const payrollEmployeeRelation = {
    employee: {
        select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
        },
    },
} satisfies Prisma.PayrollInclude;

export type PayrollWithEmployee = Prisma.PayrollGetPayload<{
    include: typeof payrollEmployeeRelation;
}>;

const buildPayrollWhere = (
    params: PayrollQueryParams,
): Prisma.PayrollWhereInput => {
    const where: Prisma.PayrollWhereInput = {};

    if (params.month !== undefined) {
        where.month = params.month;
    }

    if (params.year !== undefined) {
        where.year = params.year;
    }

    const search = params.search?.trim();
    if (search) {
        where.employee = {
            is: {
                OR: [
                    {
                        fullName: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        employeeCode: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            },
        };
    }

    return where;
};

const buildPayrollOrderBy = (
    params: PayrollQueryParams,
): Prisma.PayrollOrderByWithRelationInput => {
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder ?? "desc";

    return {
        [sortBy]: sortOrder,
    };
};

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

    findPayrollById(id: string): Promise<Payroll | null> {
        return prisma.payroll.findUnique({
            where: { id },
        });
    },

    updatePayroll(id: string, data: UpdatePayrollData): Promise<Payroll> {
        return prisma.payroll.update({
            where: { id },
            data,
        });
    },

    findPayrolls(params: PayrollQueryParams): Promise<PayrollWithEmployee[]> {
        return prisma.payroll.findMany({
            where: buildPayrollWhere(params),
            orderBy: buildPayrollOrderBy(params),
            skip: params.skip,
            take: params.take,
            include: payrollEmployeeRelation,
        });
    },

    countPayrolls(params: PayrollQueryParams): Promise<number> {
        return prisma.payroll.count({
            where: buildPayrollWhere(params),
        });
    },
};
