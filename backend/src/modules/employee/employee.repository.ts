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

const employeeProfileDepartmentRelation = {
    department: {
        select: {
            id: true,
            name: true,
        },
    },
} satisfies Prisma.EmployeeInclude;

export type EmployeeProfileWithDepartment = Prisma.EmployeeGetPayload<{
    include: typeof employeeProfileDepartmentRelation;
}>;

const employeeExportSelect = {
    employeeCode: true,
    fullName: true,
    email: true,
    phone: true,
    position: true,
    status: true,
    joinedAt: true,
    department: {
        select: {
            name: true,
        },
    },
} satisfies Prisma.EmployeeSelect;

export type EmployeeExportRow = Prisma.EmployeeGetPayload<{
    select: typeof employeeExportSelect;
}>;

const employeeDuplicateCheckSelect = {
    id: true,
    employeeCode: true,
    email: true,
} satisfies Prisma.EmployeeSelect;

export type EmployeeDuplicateCheckRow = Prisma.EmployeeGetPayload<{
    select: typeof employeeDuplicateCheckSelect;
}>;

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

    findEmployeesForExport(
        params: EmployeeQueryParams,
    ): Promise<EmployeeExportRow[]> {
        return prisma.employee.findMany({
            where: buildEmployeeWhere(params),
            orderBy: buildEmployeeOrderBy(params),
            select: employeeExportSelect,
        });
    },

    findEmployeeById(id: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { id },
        });
    },

    findEmployeeByUserId(userId: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { userId },
        });
    },

    findEmployeeProfileByUserId(
        userId: string,
    ): Promise<EmployeeProfileWithDepartment | null> {
        return prisma.employee.findUnique({
            where: { userId },
            include: employeeProfileDepartmentRelation,
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

    findEmployeesByEmails(
        emails: string[],
    ): Promise<EmployeeDuplicateCheckRow[]> {
        if (emails.length === 0) {
            return Promise.resolve([]);
        }

        return prisma.employee.findMany({
            where: {
                OR: emails.map((email) => ({
                    email: {
                        equals: email,
                        mode: "insensitive",
                    },
                })),
            },
            select: employeeDuplicateCheckSelect,
        });
    },

    findEmployeeByEmployeeCode(employeeCode: string): Promise<Employee | null> {
        return prisma.employee.findUnique({
            where: { employeeCode },
        });
    },

    findEmployeesByEmployeeCodes(
        employeeCodes: string[],
    ): Promise<EmployeeDuplicateCheckRow[]> {
        if (employeeCodes.length === 0) {
            return Promise.resolve([]);
        }

        return prisma.employee.findMany({
            where: {
                employeeCode: {
                    in: employeeCodes,
                },
            },
            select: employeeDuplicateCheckSelect,
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
