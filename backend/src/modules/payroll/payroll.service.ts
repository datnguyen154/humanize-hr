import { PayrollStatus, Prisma, type Payroll } from "@prisma/client";

import { employeeRepository } from "../employee/employee.repository";
import { generatePayrollPdf } from "./payroll-pdf.generator";
import {
    payrollRepository,
    type EmployeePayroll,
    type PayrollSortBy,
    type PayrollSortOrder,
    type PayrollWithEmployee,
} from "./payroll.repository";

type CreatePayrollInput = {
    employeeId?: unknown;
    month?: unknown;
    year?: unknown;
    baseSalary?: unknown;
    bonus?: unknown;
    deduction?: unknown;
    note?: unknown;
};

type UpdatePayrollInput = {
    baseSalary?: unknown;
    bonus?: unknown;
    deduction?: unknown;
    note?: unknown;
};

type CreatedPayroll = Pick<
    Payroll,
    | "id"
    | "employeeId"
    | "month"
    | "year"
    | "baseSalary"
    | "bonus"
    | "deduction"
    | "netSalary"
    | "note"
    | "status"
    | "createdAt"
    | "updatedAt"
>;

type GetPayrollsQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    month?: number | string;
    year?: number | string;
    sortBy?: PayrollSortBy;
    sortOrder?: PayrollSortOrder;
};

type GetMyPayrollsQuery = {
    page?: number | string;
    limit?: number | string;
    month?: number | string;
    year?: number | string;
};

type GetPayrollsPagination = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type GetPayrollsResult = {
    data: PayrollWithEmployee[];
    pagination: GetPayrollsPagination;
};

type GetMyPayrollsResult = {
    data: EmployeePayroll[];
    pagination: GetPayrollsPagination;
};

type DownloadMyPayrollPdfResult = {
    buffer: Buffer;
    filename: string;
};

export class PayrollServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "PayrollServiceError";
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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
        throw new PayrollServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new PayrollServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const parseRequiredString = (value: unknown, fieldName: string): string => {
    if (!isNonEmptyString(value)) {
        throw new PayrollServiceError(`${fieldName} is required`, 400);
    }

    return value.trim();
};

const parseRequiredInteger = (value: unknown, fieldName: string): number => {
    if (value === undefined || value === null || value === "") {
        throw new PayrollServiceError(`${fieldName} is required`, 400);
    }

    const parsedValue =
        typeof value === "number" ? value : Number(String(value));

    if (!Number.isInteger(parsedValue)) {
        throw new PayrollServiceError(`${fieldName} must be an integer`, 400);
    }

    return parsedValue;
};

const parseOptionalDecimal = (
    value: unknown,
    fieldName: string,
    defaultValue: string,
): Prisma.Decimal => {
    if (value === undefined || value === null || value === "") {
        return new Prisma.Decimal(defaultValue);
    }

    let decimal: Prisma.Decimal;

    try {
        decimal = new Prisma.Decimal(String(value));
    } catch {
        throw new PayrollServiceError(
            `${fieldName} must be a valid number`,
            400,
        );
    }

    if (decimal.isNegative()) {
        throw new PayrollServiceError(
            `${fieldName} must be greater than or equal to 0`,
            400,
        );
    }

    return decimal;
};

const parseOptionalUpdateDecimal = (
    value: unknown,
    fieldName: string,
): Prisma.Decimal | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === "") {
        throw new PayrollServiceError(
            `${fieldName} must be a valid number`,
            400,
        );
    }

    return parseOptionalDecimal(value, fieldName, "0");
};

const parseRequiredDecimal = (
    value: unknown,
    fieldName: string,
): Prisma.Decimal => {
    if (value === undefined || value === null || value === "") {
        throw new PayrollServiceError(`${fieldName} is required`, 400);
    }

    return parseOptionalDecimal(value, fieldName, "0");
};

const parseOptionalNote = (value: unknown): string | null => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== "string") {
        throw new PayrollServiceError("note must be a string", 400);
    }

    const note = value.trim();

    return note.length > 0 ? note : null;
};

const parseOptionalUpdateNote = (value: unknown): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        throw new PayrollServiceError("note must be a string", 400);
    }

    const note = value.trim();

    return note.length > 0 ? note : null;
};

const toCreatedPayroll = (payroll: Payroll): CreatedPayroll => ({
    id: payroll.id,
    employeeId: payroll.employeeId,
    month: payroll.month,
    year: payroll.year,
    baseSalary: payroll.baseSalary,
    bonus: payroll.bonus,
    deduction: payroll.deduction,
    netSalary: payroll.netSalary,
    note: payroll.note,
    status: payroll.status,
    createdAt: payroll.createdAt,
    updatedAt: payroll.updatedAt,
});

const sanitizeFilenamePart = (value: string): string =>
    value.replace(/[^a-zA-Z0-9_-]/g, "-");

export const payrollService = {
    async getPayrolls(query: GetPayrollsQuery): Promise<GetPayrollsResult> {
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );

        let parsedMonth: number | undefined;
        if (query.month !== undefined && query.month !== "") {
            parsedMonth = Number(query.month);
            if (
                !Number.isInteger(parsedMonth) ||
                parsedMonth < 1 ||
                parsedMonth > 12
            ) {
                throw new PayrollServiceError(
                    "month must be between 1 and 12",
                    400,
                );
            }
        }

        let parsedYear: number | undefined;
        if (query.year !== undefined && query.year !== "") {
            parsedYear = Number(query.year);
            if (!Number.isInteger(parsedYear) || parsedYear <= 2000) {
                throw new PayrollServiceError(
                    "year must be greater than 2000",
                    400,
                );
            }
        }

        const repositoryParams = {
            skip,
            take,
            search: query.search,
            month: parsedMonth,
            year: parsedYear,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };

        const [payrolls, totalItems] = await Promise.all([
            payrollRepository.findPayrolls(repositoryParams),
            payrollRepository.countPayrolls(repositoryParams),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: payrolls,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    async getMyPayrolls(
        userId: string | undefined,
        query: GetMyPayrollsQuery,
    ): Promise<GetMyPayrollsResult> {
        if (!userId) {
            throw new PayrollServiceError("Unauthorized", 401);
        }

        const employee = await employeeRepository.findEmployeeByUserId(userId);

        if (!employee) {
            throw new PayrollServiceError("Employee profile not found", 404);
        }

        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );

        let parsedMonth: number | undefined;
        if (query.month !== undefined && query.month !== "") {
            parsedMonth = Number(query.month);
            if (
                !Number.isInteger(parsedMonth) ||
                parsedMonth < 1 ||
                parsedMonth > 12
            ) {
                throw new PayrollServiceError(
                    "month must be between 1 and 12",
                    400,
                );
            }
        }

        let parsedYear: number | undefined;
        if (query.year !== undefined && query.year !== "") {
            parsedYear = Number(query.year);
            if (!Number.isInteger(parsedYear) || parsedYear <= 2000) {
                throw new PayrollServiceError(
                    "year must be greater than 2000",
                    400,
                );
            }
        }

        const repositoryParams = {
            employeeId: employee.id,
            skip,
            take,
            month: parsedMonth,
            year: parsedYear,
        };

        const [payrolls, totalItems] = await Promise.all([
            payrollRepository.findEmployeePayrolls(repositoryParams),
            payrollRepository.countEmployeePayrolls(repositoryParams),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: payrolls,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    async downloadMyPayrollPdf(
        userId: string | undefined,
        payrollId: string,
    ): Promise<DownloadMyPayrollPdfResult> {
        if (!userId) {
            throw new PayrollServiceError("Unauthorized", 401);
        }

        if (!UUID_REGEX.test(payrollId)) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        const employee = await employeeRepository.findEmployeeByUserId(userId);

        if (!employee) {
            throw new PayrollServiceError("Employee profile not found", 404);
        }

        const payroll =
            await payrollRepository.findEmployeePublishedPayrollById(
                payrollId,
                employee.id,
            );

        if (!payroll) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        const buffer = await generatePayrollPdf(payroll);
        const month = String(payroll.month).padStart(2, "0");
        const employeeCode = sanitizeFilenamePart(
            payroll.employee.employeeCode,
        );

        return {
            buffer,
            filename: `payroll-${payroll.year}-${month}-${employeeCode}.pdf`,
        };
    },

    async createPayroll(data: CreatePayrollInput): Promise<CreatedPayroll> {
        const employeeId = parseRequiredString(data.employeeId, "employeeId");

        if (!UUID_REGEX.test(employeeId)) {
            throw new PayrollServiceError(
                "employeeId must be a valid UUID",
                400,
            );
        }

        const month = parseRequiredInteger(data.month, "month");

        if (month < 1 || month > 12) {
            throw new PayrollServiceError(
                "month must be between 1 and 12",
                400,
            );
        }

        const year = parseRequiredInteger(data.year, "year");
        const baseSalary = parseRequiredDecimal(data.baseSalary, "baseSalary");
        const bonus = parseOptionalDecimal(data.bonus, "bonus", "0");
        const deduction = parseOptionalDecimal(
            data.deduction,
            "deduction",
            "0",
        );
        const note = parseOptionalNote(data.note);

        const employee = await employeeRepository.findEmployeeById(employeeId);

        if (!employee) {
            throw new PayrollServiceError("Employee not found", 404);
        }

        const existingPayroll =
            await payrollRepository.findPayrollByEmployeeMonthYear(
                employeeId,
                month,
                year,
            );

        if (existingPayroll) {
            throw new PayrollServiceError("Payroll already exists", 409);
        }

        const netSalary = baseSalary.plus(bonus).minus(deduction);

        const payroll = await payrollRepository.createPayroll({
            employeeId,
            month,
            year,
            baseSalary,
            bonus,
            deduction,
            netSalary,
            note,
        });

        return toCreatedPayroll(payroll);
    },

    async updatePayroll(
        id: string,
        data: UpdatePayrollInput,
    ): Promise<CreatedPayroll> {
        if (!UUID_REGEX.test(id)) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        const existingPayroll = await payrollRepository.findPayrollById(id);

        if (!existingPayroll) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        if (existingPayroll.status !== PayrollStatus.DRAFT) {
            throw new PayrollServiceError(
                "Published payroll cannot be updated",
                400,
            );
        }

        const baseSalary = parseOptionalUpdateDecimal(
            data.baseSalary,
            "baseSalary",
        );
        const bonus = parseOptionalUpdateDecimal(data.bonus, "bonus");
        const deduction = parseOptionalUpdateDecimal(
            data.deduction,
            "deduction",
        );
        const note = parseOptionalUpdateNote(data.note);

        const finalBaseSalary = baseSalary ?? existingPayroll.baseSalary;
        const finalBonus = bonus ?? existingPayroll.bonus;
        const finalDeduction = deduction ?? existingPayroll.deduction;
        const netSalary = finalBaseSalary
            .plus(finalBonus)
            .minus(finalDeduction);

        const updateData = {
            baseSalary,
            bonus,
            deduction,
            note,
            netSalary,
        };

        const payroll = await payrollRepository.updatePayroll(id, updateData);

        return toCreatedPayroll(payroll);
    },

    async publishPayroll(id: string): Promise<CreatedPayroll> {
        if (!UUID_REGEX.test(id)) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        const existingPayroll = await payrollRepository.findPayrollById(id);

        if (!existingPayroll) {
            throw new PayrollServiceError("Payroll not found", 404);
        }

        if (existingPayroll.status !== PayrollStatus.DRAFT) {
            throw new PayrollServiceError(
                "Only draft payroll can be published",
                400,
            );
        }

        const payroll = await payrollRepository.publishPayroll(id);

        return toCreatedPayroll(payroll);
    },
};
