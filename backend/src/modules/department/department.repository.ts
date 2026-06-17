import type { Department, DepartmentStatus, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type DepartmentSortBy = "name" | "status" | "createdAt" | "updatedAt";

export type DepartmentSortOrder = "asc" | "desc";

export type DepartmentQueryParams = {
    skip?: number;
    take?: number;
    search?: string;
    status?: DepartmentStatus;
    sortBy?: DepartmentSortBy;
    sortOrder?: DepartmentSortOrder;
};

export type CreateDepartmentData = Prisma.DepartmentCreateInput;
export type UpdateDepartmentData = Prisma.DepartmentUpdateInput;

const buildDepartmentWhere = (
    params: DepartmentQueryParams,
): Prisma.DepartmentWhereInput => {
    const where: Prisma.DepartmentWhereInput = {};
    const search = params.search?.trim();

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                description: {
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

const buildDepartmentOrderBy = (
    params: DepartmentQueryParams,
): Prisma.DepartmentOrderByWithRelationInput => {
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder ?? "desc";

    return {
        [sortBy]: sortOrder,
    };
};

export const departmentRepository = {
    findDepartments(params: DepartmentQueryParams): Promise<Department[]> {
        return prisma.department.findMany({
            where: buildDepartmentWhere(params),
            orderBy: buildDepartmentOrderBy(params),
            skip: params.skip,
            take: params.take,
        });
    },

    countDepartments(params: DepartmentQueryParams): Promise<number> {
        return prisma.department.count({
            where: buildDepartmentWhere(params),
        });
    },

    findDepartmentById(id: string): Promise<Department | null> {
        return prisma.department.findUnique({
            where: { id },
        });
    },

    findDepartmentByName(name: string): Promise<Department | null> {
        return prisma.department.findUnique({
            where: { name },
        });
    },

    createDepartment(data: CreateDepartmentData): Promise<Department> {
        return prisma.department.create({
            data,
        });
    },

    updateDepartment(
        id: string,
        data: UpdateDepartmentData,
    ): Promise<Department> {
        return prisma.department.update({
            where: { id },
            data,
        });
    },

    updateDepartmentStatus(
        id: string,
        status: DepartmentStatus,
    ): Promise<Department> {
        return prisma.department.update({
            where: { id },
            data: { status },
        });
    },
};
