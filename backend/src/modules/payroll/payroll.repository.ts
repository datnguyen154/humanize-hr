import { PayrollStatus, type Payroll, type Prisma } from "@prisma/client";

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

export type EmployeePayrollQueryParams = {
    employeeId: string;
    skip?: number;
    take?: number;
    month?: number;
    year?: number;
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

const employeePayrollSelect = {
    id: true,
    month: true,
    year: true,
    baseSalary: true,
    bonus: true,
    deduction: true,
    netSalary: true,
    note: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.PayrollSelect;

export type EmployeePayroll = Prisma.PayrollGetPayload<{
    select: typeof employeePayrollSelect;
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

const buildEmployeePayrollWhere = (
    params: EmployeePayrollQueryParams,
): Prisma.PayrollWhereInput => {
    const where: Prisma.PayrollWhereInput = {
        employeeId: params.employeeId,
        status: PayrollStatus.PUBLISHED,
    };

    if (params.month !== undefined) {
        where.month = params.month;
    }

    if (params.year !== undefined) {
        where.year = params.year;
    }

    return where;
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

    publishPayroll(id: string): Promise<Payroll> {
        return prisma.payroll.update({
            where: { id },
            data: {
                status: PayrollStatus.PUBLISHED,
            },
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

    findEmployeePayrolls(
        params: EmployeePayrollQueryParams,
    ): Promise<EmployeePayroll[]> {
        return prisma.payroll.findMany({
            where: buildEmployeePayrollWhere(params),
            orderBy: [{ year: "desc" }, { month: "desc" }],
            skip: params.skip,
            take: params.take,
            select: employeePayrollSelect,
        });
    },

    countEmployeePayrolls(params: EmployeePayrollQueryParams): Promise<number> {
        return prisma.payroll.count({
            where: buildEmployeePayrollWhere(params),
        });
    },
};
