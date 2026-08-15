import { EmployeeStatus } from "@prisma/client";

import { departmentRepository } from "../department/department.repository";
import {
    employeeRepository,
    type EmployeeDuplicateCheckRow,
} from "./employee.repository";
import type {
    EmployeeImportCellValue,
    EmployeeImportField,
    EmployeeImportRowError,
    ParsedEmployeeImportRow,
} from "./employee-import.parser";

export type ValidatedEmployeeImportRow = {
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
            addImportError(
                errors,
                rowNumber,
                field,
                `${importFieldLabels[field]} is required`,
            );
        }

        return undefined;
    }

    if (typeof value !== "string" && typeof value !== "number") {
        addImportError(
            errors,
            rowNumber,
            field,
            `${importFieldLabels[field]} is invalid`,
        );
        return undefined;
    }

    const text = String(value).trim();

    if (!text && required) {
        addImportError(
            errors,
            rowNumber,
            field,
            `${importFieldLabels[field]} is required`,
        );
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
        addImportError(
            errors,
            rowNumber,
            "joinedAt",
            "Ngày vào làm is required",
        );
        return undefined;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            addImportError(
                errors,
                rowNumber,
                "joinedAt",
                "Ngày vào làm is invalid",
            );
            return undefined;
        }

        return value;
    }

    if (typeof value === "string") {
        const date = parseDateString(value.trim());

        if (!date) {
            addImportError(
                errors,
                rowNumber,
                "joinedAt",
                "Ngày vào làm must use DD/MM/YYYY",
            );
            return undefined;
        }

        return date;
    }

    addImportError(errors, rowNumber, "joinedAt", "Ngày vào làm is invalid");
    return undefined;
};

const normalizeImportRow = (
    row: ParsedEmployeeImportRow,
): ValidatedEmployeeImportRow => {
    const errors = [...row.errors];

    return {
        rowNumber: row.rowNumber,
        employeeCode: parseImportText(
            row.values.employeeCode,
            row.rowNumber,
            "employeeCode",
            errors,
        ),
        fullName: parseImportText(
            row.values.fullName,
            row.rowNumber,
            "fullName",
            errors,
        ),
        email: parseImportEmail(row.values.email, row.rowNumber, errors),
        phone: parseImportText(
            row.values.phone,
            row.rowNumber,
            "phone",
            errors,
        ),
        position: parseImportText(
            row.values.position,
            row.rowNumber,
            "position",
            errors,
        ),
        departmentName:
            parseImportText(
                row.values.department,
                row.rowNumber,
                "department",
                errors,
                false,
            ) ?? null,
        status: parseImportStatus(row.values.status, row.rowNumber, errors),
        joinedAt: parseImportJoinedAt(
            row.values.joinedAt,
            row.rowNumber,
            errors,
        ),
        errors,
    };
};

const addDuplicateErrors = (
    rows: ValidatedEmployeeImportRow[],
    getValue: (row: ValidatedEmployeeImportRow) => string | undefined,
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
        const rowNumbers = value ? rowNumbersByValue.get(value) ?? [] : [];

        if (rowNumbers.length > 1) {
            addImportError(row.errors, row.rowNumber, field, message);
        }
    });
};

const addDatabaseDuplicateErrors = (
    rows: ValidatedEmployeeImportRow[],
    existingEmployeesByCode: EmployeeDuplicateCheckRow[],
    existingEmployeesByEmail: EmployeeDuplicateCheckRow[],
): void => {
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
};

export const validateEmployeeImportRows = async (
    parsedRows: ParsedEmployeeImportRow[],
): Promise<ValidatedEmployeeImportRow[]> => {
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

    addDatabaseDuplicateErrors(
        rows,
        existingEmployeesByCode,
        existingEmployeesByEmail,
    );

    const departmentNames = [
        ...new Set(
            rows
                .map((row) => row.departmentName)
                .filter((value): value is string => Boolean(value)),
        ),
    ];

    const departments =
        await departmentRepository.findDepartmentsByNames(departmentNames);
    const departmentByName = new Map(
        departments.map((department) => [department.name, department]),
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

    return rows;
};
