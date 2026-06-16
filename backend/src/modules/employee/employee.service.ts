import { EmployeeStatus, Gender, type Employee } from "@prisma/client";

import {
    employeeRepository,
    type EmployeeSortBy,
    type EmployeeSortOrder,
} from "./employee.repository";

type GetEmployeesQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    status?: EmployeeStatus;
    sortBy?: EmployeeSortBy;
    sortOrder?: EmployeeSortOrder;
};

type GetEmployeesMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type GetEmployeesResult = {
    data: Employee[];
    meta: GetEmployeesMeta;
};

type EmployeeDetail = Pick<
    Employee,
    | "id"
    | "employeeCode"
    | "fullName"
    | "email"
    | "phone"
    | "position"
    | "status"
    | "joinedAt"
    | "createdAt"
    | "updatedAt"
>;

type CreateEmployeeInput = {
    employeeCode?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    status?: string;
    joinedAt?: string;
};

type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

type CreatedEmployee = Pick<
    Employee,
    | "id"
    | "employeeCode"
    | "fullName"
    | "email"
    | "phone"
    | "position"
    | "status"
    | "joinedAt"
    | "createdAt"
    | "updatedAt"
>;

type EmployeeStatusResult = Pick<Employee, "id" | "status">;

export class EmployeeServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "EmployeeServiceError";
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_DATE_OF_BIRTH = new Date("1970-01-01T00:00:00.000Z");
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const parseRequiredString = (value: unknown, fieldName: string): string => {
    if (!isNonEmptyString(value)) {
        throw new EmployeeServiceError(`${fieldName} is required`, 400);
    }

    return value.trim();
};

const parseEmployeeStatus = (value: unknown): EmployeeStatus => {
    if (value === EmployeeStatus.ACTIVE || value === EmployeeStatus.INACTIVE) {
        return value;
    }

    throw new EmployeeServiceError("Invalid status", 400);
};

const parseRequiredDate = (value: unknown, fieldName: string): Date => {
    if (!isNonEmptyString(value)) {
        throw new EmployeeServiceError(`${fieldName} is required`, 400);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new EmployeeServiceError(
            `${fieldName} must be a valid date`,
            400,
        );
    }

    return date;
};

const toCreatedEmployee = (employee: Employee): CreatedEmployee => ({
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    status: employee.status,
    joinedAt: employee.joinedAt,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
});

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
        throw new EmployeeServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new EmployeeServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

export const employeeService = {
    async getEmployees(query: GetEmployeesQuery): Promise<GetEmployeesResult> {
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

        const [employees, totalItems] = await Promise.all([
            employeeRepository.findEmployees(repositoryParams),
            employeeRepository.countEmployees(repositoryParams),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: employees,
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

    async getEmployeeById(id: string): Promise<EmployeeDetail> {
        if (!UUID_REGEX.test(id)) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        const employee = await employeeRepository.findEmployeeById(id);

        if (!employee) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        return {
            id: employee.id,
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            status: employee.status,
            joinedAt: employee.joinedAt,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt,
        };
    },

    async createEmployee(data: CreateEmployeeInput): Promise<CreatedEmployee> {
        const employeeCode = parseRequiredString(
            data.employeeCode,
            "employeeCode",
        );
        const fullName = parseRequiredString(data.fullName, "fullName");
        const email = parseRequiredString(data.email, "email");
        const phone = parseRequiredString(data.phone, "phone");
        const position = parseRequiredString(data.position, "position");
        const status = parseEmployeeStatus(data.status);
        const joinedAt = parseRequiredDate(data.joinedAt, "joinedAt");

        const existingEmployeeByCode =
            await employeeRepository.findEmployeeByEmployeeCode(employeeCode);

        if (existingEmployeeByCode) {
            throw new EmployeeServiceError("employeeCode already exists", 409);
        }

        const existingEmployeeByEmail =
            await employeeRepository.findEmployeeByEmail(email);

        if (existingEmployeeByEmail) {
            throw new EmployeeServiceError("email already exists", 409);
        }

        const employee = await employeeRepository.createEmployee({
            employeeCode,
            fullName,
            email,
            phone,
            gender: Gender.OTHER,
            dateOfBirth: DEFAULT_DATE_OF_BIRTH,
            position,
            departmentId: null,
            status,
            joinedAt,
        });

        return toCreatedEmployee(employee);
    },

    async updateEmployee(
        id: string,
        data: UpdateEmployeeInput,
    ): Promise<CreatedEmployee> {
        if (!UUID_REGEX.test(id)) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        const existingEmployee = await employeeRepository.findEmployeeById(id);

        if (!existingEmployee) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        const updateData: {
            employeeCode?: string;
            fullName?: string;
            email?: string;
            phone?: string;
            position?: string;
            status?: EmployeeStatus;
            joinedAt?: Date;
        } = {};

        if (data.employeeCode !== undefined) {
            updateData.employeeCode = parseRequiredString(
                data.employeeCode,
                "employeeCode",
            );

            const employeeWithSameCode =
                await employeeRepository.findEmployeeByEmployeeCode(
                    updateData.employeeCode,
                );

            if (employeeWithSameCode && employeeWithSameCode.id !== id) {
                throw new EmployeeServiceError(
                    "employeeCode already exists",
                    409,
                );
            }
        }

        if (data.fullName !== undefined) {
            updateData.fullName = parseRequiredString(
                data.fullName,
                "fullName",
            );
        }

        if (data.email !== undefined) {
            updateData.email = parseRequiredString(data.email, "email");

            const employeeWithSameEmail =
                await employeeRepository.findEmployeeByEmail(updateData.email);

            if (employeeWithSameEmail && employeeWithSameEmail.id !== id) {
                throw new EmployeeServiceError("email already exists", 409);
            }
        }

        if (data.phone !== undefined) {
            updateData.phone = parseRequiredString(data.phone, "phone");
        }

        if (data.position !== undefined) {
            updateData.position = parseRequiredString(
                data.position,
                "position",
            );
        }

        if (data.status !== undefined) {
            updateData.status = parseEmployeeStatus(data.status);
        }

        if (data.joinedAt !== undefined) {
            updateData.joinedAt = parseRequiredDate(data.joinedAt, "joinedAt");
        }

        const updatedEmployee = await employeeRepository.updateEmployee(
            id,
            updateData,
        );

        return toCreatedEmployee(updatedEmployee);
    },

    async updateEmployeeStatus(
        id: string,
        statusInput: string | undefined,
    ): Promise<EmployeeStatusResult> {
        if (!UUID_REGEX.test(id)) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        const existingEmployee = await employeeRepository.findEmployeeById(id);

        if (!existingEmployee) {
            throw new EmployeeServiceError("Employee not found", 404);
        }

        const status = parseEmployeeStatus(statusInput);
        const updatedEmployee = await employeeRepository.updateEmployeeStatus(
            id,
            status,
        );

        return {
            id: updatedEmployee.id,
            status: updatedEmployee.status,
        };
    },
};
