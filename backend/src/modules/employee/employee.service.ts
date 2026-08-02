import { EmployeeStatus, Gender, Prisma, type Employee } from "@prisma/client";

import { departmentRepository } from "../department/department.repository";
import { generateEmployeesExcel } from "./employee-excel.generator";
import {
    EmployeeImportFileError,
    parseEmployeeImportWorkbook,
    type EmployeeImportCellValue,
    type EmployeeImportField,
    type EmployeeImportRowError,
    type ParsedEmployeeImportRow,
} from "./employee-import.parser";
import { generateEmployeeImportTemplate } from "./employee-import-template.generator";
import {
    employeeRepository,
    type EmployeeProfileWithDepartment,
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

type ExportEmployeesQuery = {
    search?: string;
    status?: EmployeeStatus;
    sortBy?: EmployeeSortBy;
    sortOrder?: EmployeeSortOrder;
};

type ExportEmployeesResult = {
    buffer: Buffer;
    filename: string;
};

type EmployeeImportCreatedEmployee = {
    rowNumber: number;
    id: string;
    employeeCode: string;
    fullName: string;
};

type ImportEmployeesResult = {
    data: {
        totalRows: number;
        successCount: number;
        failedCount: number;
        createdEmployees: EmployeeImportCreatedEmployee[];
        errors: EmployeeImportRowError[];
    };
};

type EmployeeImportTemplateResult = {
    buffer: Buffer;
    filename: string;
};

type NormalizedImportRow = {
    rowNumber: number;
    employeeCode?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    departmentName?: string | null;
    departmentId?: string | null;
    status?: EmployeeStatus;
    joinedAt?: Date;
    errors: EmployeeImportRowError[];
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

type EmployeeSelfProfile = Pick<
    Employee,
    | "id"
    | "employeeCode"
    | "fullName"
    | "email"
    | "phone"
    | "position"
    | "status"
    | "joinedAt"
    | "departmentId"
    | "createdAt"
    | "updatedAt"
> & {
    department: {
        id: string;
        name: string;
    } | null;
};

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

const toEmployeeSelfProfile = (
    employee: EmployeeProfileWithDepartment,
): EmployeeSelfProfile => ({
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    status: employee.status,
    joinedAt: employee.joinedAt,
    departmentId: employee.departmentId,
    department: employee.department,
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

const formatExportDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const importFieldLabels: Record<EmployeeImportField, string> = {
    employeeCode: "Mã nhân viên",
    fullName: "Họ tên",
    email: "Email",
    phone: "Số điện thoại",
    position: "Chức vụ",
    department: "Phòng ban",
    status: "Trạng thái",
    joinedAt: "Ngày vào làm",
};

const addImportError = (
    errors: EmployeeImportRowError[],
    rowNumber: number,
    field: EmployeeImportField,
    message: string,
): void => {
    errors.push({
        rowNumber,
        field: importFieldLabels[field],
        message,
    });
};

const parseImportText = (
    value: EmployeeImportCellValue,
    rowNumber: number,
    field: EmployeeImportField,
    errors: EmployeeImportRowError[],
    required = true,
): string | undefined => {
    if (value === null || value === "") {
        if (required) {
            addImportError(errors, rowNumber, field, `${importFieldLabels[field]} is required`);
        }

        return undefined;
    }

    if (typeof value !== "string" && typeof value !== "number") {
        addImportError(errors, rowNumber, field, `${importFieldLabels[field]} is invalid`);
        return undefined;
    }

    const text = String(value).trim();

    if (!text && required) {
        addImportError(errors, rowNumber, field, `${importFieldLabels[field]} is required`);
        return undefined;
    }

    return text || undefined;
};

const parseImportEmail = (
    value: EmployeeImportCellValue,
    rowNumber: number,
    errors: EmployeeImportRowError[],
): string | undefined => {
    const email = parseImportText(value, rowNumber, "email", errors);

    if (!email) {
        return undefined;
    }

    const normalizedEmail = email.toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        addImportError(errors, rowNumber, "email", "Email is invalid");
        return undefined;
    }

    return normalizedEmail;
};

const parseImportStatus = (
    value: EmployeeImportCellValue,
    rowNumber: number,
    errors: EmployeeImportRowError[],
): EmployeeStatus | undefined => {
    const status = parseImportText(value, rowNumber, "status", errors);

    if (!status) {
        return undefined;
    }

    if (status === "ACTIVE" || status === "Đang hoạt động") {
        return EmployeeStatus.ACTIVE;
    }

    if (status === "INACTIVE" || status === "Ngừng hoạt động") {
        return EmployeeStatus.INACTIVE;
    }

    addImportError(errors, rowNumber, "status", "Trạng thái is invalid");
    return undefined;
};

const parseDateString = (value: string): Date | null => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
};

const parseImportJoinedAt = (
    value: EmployeeImportCellValue,
    rowNumber: number,
    errors: EmployeeImportRowError[],
): Date | undefined => {
    if (value === null || value === "") {
        addImportError(errors, rowNumber, "joinedAt", "Ngày vào làm is required");
        return undefined;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            addImportError(errors, rowNumber, "joinedAt", "Ngày vào làm is invalid");
            return undefined;
        }

        return value;
    }

    if (typeof value === "string") {
        const date = parseDateString(value.trim());

        if (!date) {
            addImportError(errors, rowNumber, "joinedAt", "Ngày vào làm must use DD/MM/YYYY");
            return undefined;
        }

        return date;
    }

    addImportError(errors, rowNumber, "joinedAt", "Ngày vào làm is invalid");
    return undefined;
};

const normalizeImportRow = (
    row: ParsedEmployeeImportRow,
): NormalizedImportRow => {
    const errors = [...row.errors];
    const employeeCode = parseImportText(
        row.values.employeeCode,
        row.rowNumber,
        "employeeCode",
        errors,
    );
    const fullName = parseImportText(
        row.values.fullName,
        row.rowNumber,
        "fullName",
        errors,
    );
    const email = parseImportEmail(row.values.email, row.rowNumber, errors);
    const phone = parseImportText(row.values.phone, row.rowNumber, "phone", errors);
    const position = parseImportText(
        row.values.position,
        row.rowNumber,
        "position",
        errors,
    );
    const departmentName =
        parseImportText(row.values.department, row.rowNumber, "department", errors, false) ??
        null;
    const status = parseImportStatus(row.values.status, row.rowNumber, errors);
    const joinedAt = parseImportJoinedAt(row.values.joinedAt, row.rowNumber, errors);

    return {
        rowNumber: row.rowNumber,
        employeeCode,
        fullName,
        email,
        phone,
        position,
        departmentName,
        status,
        joinedAt,
        errors,
    };
};

const addDuplicateErrors = (
    rows: NormalizedImportRow[],
    getValue: (row: NormalizedImportRow) => string | undefined,
    field: EmployeeImportField,
    message: string,
): void => {
    const rowNumbersByValue = new Map<string, number[]>();

    rows.forEach((row) => {
        const value = getValue(row);

        if (!value) {
            return;
        }

        const rowNumbers = rowNumbersByValue.get(value) ?? [];
        rowNumbers.push(row.rowNumber);
        rowNumbersByValue.set(value, rowNumbers);
    });

    rows.forEach((row) => {
        const value = getValue(row);

        if (!value) {
            return;
        }

        const rowNumbers = rowNumbersByValue.get(value) ?? [];

        if (rowNumbers.length > 1) {
            addImportError(row.errors, row.rowNumber, field, message);
        }
    });
};

const isPrismaUniqueError = (
    error: unknown,
): error is Prisma.PrismaClientKnownRequestError =>
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002";

const normalizePrismaTarget = (target: unknown): string => {
    if (Array.isArray(target)) {
        return target.join(" ");
    }

    return String(target ?? "");
};

export const employeeService = {
    async getMyProfile(
        userId: string | undefined,
    ): Promise<EmployeeSelfProfile> {
        if (!userId) {
            throw new EmployeeServiceError("Unauthorized", 401);
        }

        const employee =
            await employeeRepository.findEmployeeProfileByUserId(userId);

        if (!employee) {
            throw new EmployeeServiceError("Employee profile not found", 404);
        }

        return toEmployeeSelfProfile(employee);
    },

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

    async exportEmployees(
        query: ExportEmployeesQuery,
    ): Promise<ExportEmployeesResult> {
        const employees = await employeeRepository.findEmployeesForExport({
            search: query.search,
            status: query.status,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });

        const buffer = await generateEmployeesExcel(employees);

        return {
            buffer,
            filename: `employees-${formatExportDate(new Date())}.xlsx`,
        };
    },

    async getEmployeeImportTemplate(): Promise<EmployeeImportTemplateResult> {
        return generateEmployeeImportTemplate();
    },

    async importEmployees(
        file: Express.Multer.File | undefined,
    ): Promise<ImportEmployeesResult> {
        if (!file) {
            throw new EmployeeServiceError("File is required", 400);
        }

        let parsedRows: ParsedEmployeeImportRow[];

        try {
            parsedRows = await parseEmployeeImportWorkbook(file.buffer);
        } catch (error) {
            if (error instanceof EmployeeImportFileError) {
                throw new EmployeeServiceError(
                    error.message,
                    error.statusCode,
                );
            }

            throw error;
        }

        const rows = parsedRows.map(normalizeImportRow);

        addDuplicateErrors(
            rows,
            (row) => row.employeeCode,
            "employeeCode",
            "Mã nhân viên is duplicated in import file",
        );
        addDuplicateErrors(
            rows,
            (row) => row.email,
            "email",
            "Email is duplicated in import file",
        );

        const employeeCodes = [
            ...new Set(
                rows
                    .map((row) => row.employeeCode)
                    .filter((value): value is string => Boolean(value)),
            ),
        ];
        const emails = [
            ...new Set(
                rows
                    .map((row) => row.email)
                    .filter((value): value is string => Boolean(value)),
            ),
        ];

        const [existingEmployeesByCode, existingEmployeesByEmail] =
            await Promise.all([
                employeeRepository.findEmployeesByEmployeeCodes(employeeCodes),
                employeeRepository.findEmployeesByEmails(emails),
            ]);

        const existingCodeSet = new Set(
            existingEmployeesByCode.map((employee) => employee.employeeCode),
        );
        const existingEmailSet = new Set(
            existingEmployeesByEmail.map((employee) =>
                employee.email.toLowerCase(),
            ),
        );

        rows.forEach((row) => {
            if (row.employeeCode && existingCodeSet.has(row.employeeCode)) {
                addImportError(
                    row.errors,
                    row.rowNumber,
                    "employeeCode",
                    "Mã nhân viên already exists",
                );
            }

            if (row.email && existingEmailSet.has(row.email)) {
                addImportError(
                    row.errors,
                    row.rowNumber,
                    "email",
                    "Email already exists",
                );
            }
        });

        const departmentNames = [
            ...new Set(
                rows
                    .map((row) => row.departmentName)
                    .filter((value): value is string => Boolean(value)),
            ),
        ];
        const departmentEntries = await Promise.all(
            departmentNames.map(async (departmentName) => ({
                departmentName,
                department:
                    await departmentRepository.findDepartmentByName(
                        departmentName,
                    ),
            })),
        );
        const departmentByName = new Map(
            departmentEntries
                .filter((entry) => entry.department)
                .map((entry) => [entry.departmentName, entry.department]),
        );

        rows.forEach((row) => {
            if (!row.departmentName) {
                row.departmentId = null;
                return;
            }

            const department = departmentByName.get(row.departmentName);

            if (!department) {
                addImportError(
                    row.errors,
                    row.rowNumber,
                    "department",
                    "Phòng ban does not exist",
                );
                return;
            }

            row.departmentId = department.id;
        });

        const createdEmployees: EmployeeImportCreatedEmployee[] = [];

        for (const row of rows) {
            if (row.errors.length > 0) {
                continue;
            }

            if (
                !row.employeeCode ||
                !row.fullName ||
                !row.email ||
                !row.phone ||
                !row.position ||
                !row.status ||
                !row.joinedAt
            ) {
                addImportError(
                    row.errors,
                    row.rowNumber,
                    "employeeCode",
                    "Employee data is incomplete",
                );
                continue;
            }

            try {
                const employee = await employeeRepository.createEmployee({
                    employeeCode: row.employeeCode,
                    fullName: row.fullName,
                    email: row.email,
                    phone: row.phone,
                    gender: Gender.OTHER,
                    dateOfBirth: DEFAULT_DATE_OF_BIRTH,
                    position: row.position,
                    departmentId: row.departmentId ?? null,
                    status: row.status,
                    joinedAt: row.joinedAt,
                });

                createdEmployees.push({
                    rowNumber: row.rowNumber,
                    id: employee.id,
                    employeeCode: employee.employeeCode,
                    fullName: employee.fullName,
                });
            } catch (error) {
                if (isPrismaUniqueError(error)) {
                    const target = normalizePrismaTarget(error.meta?.target);
                    const isEmployeeCodeUniqueError =
                        target.includes("employeeCode");
                    const isEmailUniqueError = target.includes("email");

                    if (isEmployeeCodeUniqueError) {
                        addImportError(
                            row.errors,
                            row.rowNumber,
                            "employeeCode",
                            "Mã nhân viên already exists",
                        );
                    }

                    if (isEmailUniqueError) {
                        addImportError(
                            row.errors,
                            row.rowNumber,
                            "email",
                            "Email already exists",
                        );
                    }

                    if (!isEmployeeCodeUniqueError && !isEmailUniqueError) {
                        addImportError(
                            row.errors,
                            row.rowNumber,
                            "employeeCode",
                            "Employee already exists",
                        );
                    }

                    continue;
                }

                throw error;
            }
        }

        const errors = rows.flatMap((row) => row.errors);
        const failedCount = rows.filter((row) => row.errors.length > 0).length;

        return {
            data: {
                totalRows: rows.length,
                successCount: createdEmployees.length,
                failedCount,
                createdEmployees,
                errors,
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
