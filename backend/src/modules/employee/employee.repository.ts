import type { Employee, EmployeeStatus, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type EmployeeSortBy =
    | "employeeCode"
    | "fullName"
    | "joinedAt"
    | "createdAt";

export type EmployeeSortOrder = "asc" | "desc";

export type EmployeeQueryParams = {
    skip?: number;
    take?: number;
    search?: string;
    status?: EmployeeStatus;
    sortBy?: EmployeeSortBy;
    sortOrder?: EmployeeSortOrder;
};

export type CreateEmployeeData = Prisma.EmployeeUncheckedCreateInput;
export type UpdateEmployeeData = Prisma.EmployeeUncheckedUpdateInput;

const buildEmployeeWhere = (
    params: EmployeeQueryParams,
): Prisma.EmployeeWhereInput => {
    const where: Prisma.EmployeeWhereInput = {};
    const search = params.search?.trim();

    if (search) {
        where.OR = [
            {
                fullName: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                email: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (params.status) {
        where.status = params.status;
    }

    return where;
};

const buildEmployeeOrderBy = (
    params: EmployeeQueryParams,
): Prisma.EmployeeOrderByWithRelationInput => {
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder ?? "desc";

    return {
        [sortBy]: sortOrder,
    };
};

export const employeeRepository = {
    findEmployees(params: EmployeeQueryParams): Promise<Employee[]> {
        return prisma.employee.findMany({
            where: buildEmployeeWhere(params),
            orderBy: buildEmployeeOrderBy(params),
            skip: params.skip,
            take: params.take,
        });
    },

    countEmployees(params: EmployeeQueryParams): Promise<number> {
        return prisma.employee.count({
            where: buildEmployeeWhere(params),
        });
    },

    findEmployeeById(id: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { id },
        });
    },

    createEmployee(data: CreateEmployeeData): Promise<Employee> {
        return prisma.employee.create({
            data,
        });
    },

    findEmployeeByEmail(email: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { email },
        });
    },

    findEmployeeByEmployeeCode(employeeCode: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { employeeCode },
        });
    },

    updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee> {
        return prisma.employee.update({
            where: { id },
            data,
        });
    },

    updateEmployeeStatus(
        id: string,
        status: EmployeeStatus,
    ): Promise<Employee> {
        return prisma.employee.update({
            where: { id },
            data: { status },
        });
    },
};
