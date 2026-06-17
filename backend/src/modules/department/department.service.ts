import { DepartmentStatus, type Department } from "@prisma/client";

import {
    departmentRepository,
    type DepartmentSortBy,
    type DepartmentSortOrder,
} from "./department.repository";

type GetDepartmentsQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    status?: DepartmentStatus;
    sortBy?: DepartmentSortBy;
    sortOrder?: DepartmentSortOrder;
};

type GetDepartmentsMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type GetDepartmentsResult = {
    data: Department[];
    meta: GetDepartmentsMeta;
};

type DepartmentDetail = Pick<
    Department,
    "id" | "name" | "description" | "status" | "createdAt" | "updatedAt"
>;

type CreateDepartmentInput = {
    name?: string;
    description?: string | null;
    status?: string;
};

type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

type DepartmentStatusResult = Pick<Department, "id" | "status">;

export class DepartmentServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "DepartmentServiceError";
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const parseRequiredString = (value: unknown, fieldName: string): string => {
    if (!isNonEmptyString(value)) {
        throw new DepartmentServiceError(`${fieldName} is required`, 400);
    }

    return value.trim();
};

const normalizeOptionalString = (
    value: string | null | undefined,
): string | null | undefined => {
    if (value === undefined || value === null) {
        return value;
    }

    return value.trim();
};

const parseDepartmentStatus = (
    value: unknown,
    defaultValue?: DepartmentStatus,
): DepartmentStatus => {
    if (value === undefined && defaultValue) {
        return defaultValue;
    }

    if (
        value === DepartmentStatus.ACTIVE ||
        value === DepartmentStatus.INACTIVE
    ) {
        return value;
    }

    throw new DepartmentServiceError("Invalid status", 400);
};

const parsePositiveInteger = (
    value: number | string | undefined,
    defaultValue: number,
): number => {
    if (value === undefined || value === "") {
        return defaultValue;
    }

    const parsedValue =
        typeof value === "number" ? value : Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue)) {
        return Number.NaN;
    }

    return parsedValue;
};

const normalizePagination = (
    pageInput: number | string | undefined,
    limitInput: number | string | undefined,
): { page: number; limit: number; skip: number; take: number } => {
    const page = parsePositiveInteger(pageInput, DEFAULT_PAGE);
    const limit = parsePositiveInteger(limitInput, DEFAULT_LIMIT);

    if (page < 1 || Number.isNaN(page)) {
        throw new DepartmentServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new DepartmentServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

const toDepartmentDetail = (department: Department): DepartmentDetail => ({
    id: department.id,
    name: department.name,
    description: department.description,
    status: department.status,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
});

export const departmentService = {
    async getDepartments(
        query: GetDepartmentsQuery = {},
    ): Promise<GetDepartmentsResult> {
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );

        const repositoryParams = {
            skip,
            take,
            search: query.search,
            status: query.status,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };

        const [departments, totalItems] = await Promise.all([
            departmentRepository.findDepartments(repositoryParams),
            departmentRepository.countDepartments(repositoryParams),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: departments,
            meta: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    async getDepartmentById(id: string): Promise<DepartmentDetail> {
        if (!UUID_REGEX.test(id)) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        const department = await departmentRepository.findDepartmentById(id);

        if (!department) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        return toDepartmentDetail(department);
    },

    async createDepartment(
        data: CreateDepartmentInput,
    ): Promise<DepartmentDetail> {
        const name = parseRequiredString(data.name, "name");
        const description = normalizeOptionalString(data.description);
        const status = parseDepartmentStatus(
            data.status,
            DepartmentStatus.ACTIVE,
        );

        const existingDepartment =
            await departmentRepository.findDepartmentByName(name);

        if (existingDepartment) {
            throw new DepartmentServiceError(
                "Department name already exists",
                409,
            );
        }

        const department = await departmentRepository.createDepartment({
            name,
            description,
            status,
        });

        return toDepartmentDetail(department);
    },

    async updateDepartment(
        id: string,
        data: UpdateDepartmentInput,
    ): Promise<DepartmentDetail> {
        if (!UUID_REGEX.test(id)) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        const existingDepartment =
            await departmentRepository.findDepartmentById(id);

        if (!existingDepartment) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        const updateData: {
            name?: string;
            description?: string | null;
            status?: DepartmentStatus;
        } = {};

        if (data.name !== undefined) {
            updateData.name = parseRequiredString(data.name, "name");

            const departmentWithSameName =
                await departmentRepository.findDepartmentByName(
                    updateData.name,
                );

            if (departmentWithSameName && departmentWithSameName.id !== id) {
                throw new DepartmentServiceError(
                    "Department name already exists",
                    409,
                );
            }
        }

        if (data.description !== undefined) {
            updateData.description = normalizeOptionalString(data.description);
        }

        if (data.status !== undefined) {
            updateData.status = parseDepartmentStatus(data.status);
        }

        const updatedDepartment = await departmentRepository.updateDepartment(
            id,
            updateData,
        );

        return toDepartmentDetail(updatedDepartment);
    },

    async updateDepartmentStatus(
        id: string,
        statusInput: string | undefined,
    ): Promise<DepartmentStatusResult> {
        if (!UUID_REGEX.test(id)) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        const existingDepartment =
            await departmentRepository.findDepartmentById(id);

        if (!existingDepartment) {
            throw new DepartmentServiceError("Department not found", 404);
        }

        const status = parseDepartmentStatus(statusInput);
        const updatedDepartment =
            await departmentRepository.updateDepartmentStatus(id, status);

        return {
            id: updatedDepartment.id,
            status: updatedDepartment.status,
        };
    },
};
