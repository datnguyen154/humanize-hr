import { EmployeeStatus } from "@prisma/client";
import type { Request, Response } from "express";

import { EmployeeServiceError, employeeService } from "./employee.service";
import type { EmployeeSortBy, EmployeeSortOrder } from "./employee.repository";

const allowedSortBy: EmployeeSortBy[] = [
    "employeeCode",
    "fullName",
    "joinedAt",
    "createdAt",
];

const allowedSortOrder: EmployeeSortOrder[] = ["asc", "desc"];

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const parseStatus = (value: unknown): EmployeeStatus | undefined => {
    const status = getSingleQueryValue(value);

    if (!status) {
        return undefined;
    }

    if (
        status === EmployeeStatus.ACTIVE ||
        status === EmployeeStatus.INACTIVE
    ) {
        return status;
    }

    throw new EmployeeServiceError("Invalid status", 400);
};

const parseSortBy = (value: unknown): EmployeeSortBy | undefined => {
    const sortBy = getSingleQueryValue(value);

    if (!sortBy) {
        return undefined;
    }

    if (allowedSortBy.includes(sortBy as EmployeeSortBy)) {
        return sortBy as EmployeeSortBy;
    }

    throw new EmployeeServiceError("Invalid sortBy", 400);
};

const parseSortOrder = (value: unknown): EmployeeSortOrder | undefined => {
    const sortOrder = getSingleQueryValue(value);

    if (!sortOrder) {
        return undefined;
    }

    if (allowedSortOrder.includes(sortOrder as EmployeeSortOrder)) {
        return sortOrder as EmployeeSortOrder;
    }

    throw new EmployeeServiceError("Invalid sortOrder", 400);
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof EmployeeServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const employeeController = {
    async getMyProfile(req: Request, res: Response): Promise<Response> {
        try {
            const employee = await employeeService.getMyProfile(
                req.user?.userId,
            );

            return res.status(200).json(employee);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getEmployees(req: Request, res: Response): Promise<Response> {
        try {
            const result = await employeeService.getEmployees({
                page: getSingleQueryValue(req.query.page),
                limit: getSingleQueryValue(req.query.limit),
                search: getSingleQueryValue(req.query.search),
                status: parseStatus(req.query.status),
                departmentId: getSingleQueryValue(req.query.departmentId),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async exportEmployees(req: Request, res: Response): Promise<Response> {
        try {
            const result = await employeeService.exportEmployees({
                search: getSingleQueryValue(req.query.search),
                status: parseStatus(req.query.status),
                sortBy: parseSortBy(req.query.sortBy),
                sortOrder: parseSortOrder(req.query.sortOrder),
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${result.filename}"`,
            );

            return res.status(200).send(result.buffer);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async importEmployees(req: Request, res: Response): Promise<Response> {
        try {
            const result = await employeeService.importEmployees(req.file);

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getEmployeeImportTemplate(
        _req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const result = await employeeService.getEmployeeImportTemplate();

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${result.filename}"`,
            );

            return res.status(200).send(result.buffer);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getEmployeeById(req: Request, res: Response): Promise<Response> {
        try {
            const employee = await employeeService.getEmployeeById(
                req.params.id,
            );

            return res.status(200).json(employee);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async createEmployee(req: Request, res: Response): Promise<Response> {
        try {
            const {
                employeeCode,
                fullName,
                email,
                phone,
                position,
                status,
                joinedAt,
                departmentId,
            } = req.body as {
                employeeCode?: string;
                fullName?: string;
                email?: string;
                phone?: string;
                position?: string;
                status?: string;
                joinedAt?: string;
                departmentId?: string | null;
            };

            const employee = await employeeService.createEmployee({
                employeeCode,
                fullName,
                email,
                phone,
                position,
                status,
                joinedAt,
                departmentId,
            });

            return res.status(201).json({
                data: employee,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async updateEmployee(req: Request, res: Response): Promise<Response> {
        try {
            const {
                employeeCode,
                fullName,
                email,
                phone,
                position,
                status,
                joinedAt,
                departmentId,
            } = req.body as {
                employeeCode?: string;
                fullName?: string;
                email?: string;
                phone?: string;
                position?: string;
                status?: string;
                joinedAt?: string;
                departmentId?: string | null;
            };

            const employee = await employeeService.updateEmployee(
                req.params.id,
                {
                    employeeCode,
                    fullName,
                    email,
                    phone,
                    position,
                    status,
                    joinedAt,
                    departmentId,
                },
            );

            return res.status(200).json({
                data: employee,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async updateEmployeeStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { status } = req.body as {
                status?: string;
            };

            const result = await employeeService.updateEmployeeStatus(
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
