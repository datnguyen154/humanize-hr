import { Prisma, type Payroll } from "@prisma/client";

import { employeeRepository } from "../employee/employee.repository";
import { payrollRepository } from "./payroll.repository";

type CreatePayrollInput = {
    employeeId?: unknown;
    month?: unknown;
    year?: unknown;
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

export class PayrollServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "PayrollServiceError";
    }
}

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

export const payrollService = {
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
};
