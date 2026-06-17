import { DepartmentStatus } from "@prisma/client";
import type { Request, Response } from "express";

import {
    DepartmentServiceError,
    departmentService,
} from "./department.service";
import type {
    DepartmentSortBy,
    DepartmentSortOrder,
} from "./department.repository";

const allowedSortBy: DepartmentSortBy[] = [
    "name",
    "status",
    "createdAt",
    "updatedAt",
];

const allowedSortOrder: DepartmentSortOrder[] = ["asc", "desc"];

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const parseStatus = (value: unknown): DepartmentStatus | undefined => {
    const status = getSingleQueryValue(value);

    if (!status) {
        return undefined;
    }

    if (
        status === DepartmentStatus.ACTIVE ||
        status === DepartmentStatus.INACTIVE
    ) {
        return status;
    }

    throw new DepartmentServiceError("Invalid status", 400);
};

const parseSortBy = (value: unknown): DepartmentSortBy | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (allowedSortBy.includes(sortBy as DepartmentSortBy)) {
        return sortBy as DepartmentSortBy;
    }

    throw new DepartmentServiceError("Invalid sortBy", 400);
};

const parseSortOrder = (value: unknown): DepartmentSortOrder | undefined => {
    const sortOrder = getSingleQueryValue(value);

    if (!sortOrder) {
        return undefined;
    }

    if (allowedSortOrder.includes(sortOrder as DepartmentSortOrder)) {
        return sortOrder as DepartmentSortOrder;
    }

    throw new DepartmentServiceError("Invalid sortOrder", 400);
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof DepartmentServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const departmentController = {
    async getDepartments(req: Request, res: Response): Promise<Response> {
        try {
            const result = await departmentService.getDepartments({
                page: getSingleQueryValue(req.query.page),
                limit: getSingleQueryValue(req.query.limit),
                search: getSingleQueryValue(req.query.search),
                status: parseStatus(req.query.status),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getDepartmentById(req: Request, res: Response): Promise<Response> {
        try {
            const department = await departmentService.getDepartmentById(
                req.params.id,
            );

            return res.status(200).json({
                data: department,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async createDepartment(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, status } = req.body as {
                name?: string;
                description?: string | null;
                status?: string;
            };

            const department = await departmentService.createDepartment({
                name,
                description,
                status,
            });

            return res.status(201).json({
                data: department,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async updateDepartment(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, status } = req.body as {
                name?: string;
                description?: string | null;
                status?: string;
            };

            const department = await departmentService.updateDepartment(
                req.params.id,
                {
                    name,
                    description,
                    status,
                },
            );

            return res.status(200).json({
                data: department,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async updateDepartmentStatus(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const { status } = req.body as {
                status?: string;
            };

            const result = await departmentService.updateDepartmentStatus(
                req.params.id,
                status,
            );

            return res.status(200).json({
                data: result,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
