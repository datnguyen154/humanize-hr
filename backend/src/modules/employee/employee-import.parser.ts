import ExcelJS from "exceljs";

export const EMPLOYEE_IMPORT_HEADERS = [
    "Mã nhân viên",
    "Họ tên",
    "Email",
    "Số điện thoại",
    "Chức vụ",
    "Phòng ban",
    "Trạng thái",
    "Ngày vào làm",
] as const;

export type EmployeeImportHeader = (typeof EMPLOYEE_IMPORT_HEADERS)[number];

export type EmployeeImportField =
    | "employeeCode"
    | "fullName"
    | "email"
    | "phone"
    | "position"
    | "department"
    | "status"
    | "joinedAt";

export type EmployeeImportCellValue = string | number | boolean | Date | null;

export type ParsedEmployeeImportRow = {
    rowNumber: number;
    values: Record<EmployeeImportField, EmployeeImportCellValue>;
    errors: EmployeeImportRowError[];
};

export type EmployeeImportRowError = {
    rowNumber: number;
    field: string;
    message: string;
};

export class EmployeeImportFileError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 400,
    ) {
        super(message);
        this.name = "EmployeeImportFileError";
    }
}

const MAX_DATA_ROWS = 1000;
const FORMULA_WITHOUT_RESULT_MESSAGE =
    "Ô chứa công thức nhưng chưa có giá trị kết quả. Hãy mở file bằng Excel/WPS, tính lại và lưu file trước khi import.";

const headerToField: Record<EmployeeImportHeader, EmployeeImportField> = {
    "Mã nhân viên": "employeeCode",
    "Họ tên": "fullName",
    Email: "email",
    "Số điện thoại": "phone",
    "Chức vụ": "position",
    "Phòng ban": "department",
    "Trạng thái": "status",
    "Ngày vào làm": "joinedAt",
};

const expectedHeaderSet = new Set<string>(EMPLOYEE_IMPORT_HEADERS);

const isFormulaValue = (
    value: ExcelJS.CellValue,
): value is ExcelJS.CellFormulaValue | ExcelJS.CellSharedFormulaValue =>
    typeof value === "object" &&
    value !== null &&
    ("formula" in value || "sharedFormula" in value);

const isCellErrorValue = (value: unknown): value is ExcelJS.CellErrorValue =>
    typeof value === "object" && value !== null && "error" in value;

const getFormulaResult = (
    value: ExcelJS.CellFormulaValue | ExcelJS.CellSharedFormulaValue,
): EmployeeImportCellValue | undefined => {
    if (!("result" in value) || value.result === undefined) {
        return undefined;
    }

    if (value.result === null || isCellErrorValue(value.result)) {
        return undefined;
    }

    return value.result;
};

const resolveCellValue = (
    cell: ExcelJS.Cell,
    rowNumber: number,
    field: string,
): { value: EmployeeImportCellValue; error?: EmployeeImportRowError } => {
    const value = cell.value;

    if (value === null) {
        return { value: null };
    }

    if (isFormulaValue(value)) {
        const result = getFormulaResult(value);

        if (result === undefined) {
            return {
                value: null,
                error: {
                    rowNumber,
                    field,
                    message: FORMULA_WITHOUT_RESULT_MESSAGE,
                },
            };
        }

        return { value: result };
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date
    ) {
        return { value };
    }

    if (typeof value === "object" && value !== null) {
        if ("text" in value && typeof value.text === "string") {
            return { value: value.text };
        }

        if ("richText" in value && Array.isArray(value.richText)) {
            return {
                value: value.richText
                    .map((item) => ("text" in item ? item.text : ""))
                    .join(""),
            };
        }
    }

    return { value: null };
};

const normalizeHeaderValue = (value: ExcelJS.CellValue): string => {
    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }

    return "";
};

const validateHeaders = (
    worksheet: ExcelJS.Worksheet,
): Map<EmployeeImportField, number> => {
    const headerRow = worksheet.getRow(1);

    if (headerRow.cellCount === 0) {
        throw new EmployeeImportFileError("Worksheet header is required");
    }

    const headerIndexMap = new Map<EmployeeImportField, number>();
    const seenHeaders = new Set<string>();
    const headers: string[] = [];

    for (let columnIndex = 1; columnIndex <= headerRow.cellCount; columnIndex += 1) {
        const header = normalizeHeaderValue(headerRow.getCell(columnIndex).value);

        if (!header) {
            throw new EmployeeImportFileError("Header cannot be empty");
        }

        if (seenHeaders.has(header)) {
            throw new EmployeeImportFileError(`Duplicate header: ${header}`);
        }

        if (!expectedHeaderSet.has(header)) {
            throw new EmployeeImportFileError(`Invalid header: ${header}`);
        }

        seenHeaders.add(header);
        headers.push(header);
        headerIndexMap.set(
            headerToField[header as EmployeeImportHeader],
            columnIndex,
        );
    }

    const missingHeaders = EMPLOYEE_IMPORT_HEADERS.filter(
        (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
        throw new EmployeeImportFileError(
            `Missing headers: ${missingHeaders.join(", ")}`,
        );
    }

    if (headers.length !== EMPLOYEE_IMPORT_HEADERS.length) {
        throw new EmployeeImportFileError("Invalid import headers");
    }

    return headerIndexMap;
};

const isEmptyCellValue = (value: EmployeeImportCellValue): boolean =>
    value === null || (typeof value === "string" && value.trim().length === 0);

const isEmptyRow = (row: ParsedEmployeeImportRow): boolean =>
    Object.values(row.values).every(isEmptyCellValue) && row.errors.length === 0;

export const parseEmployeeImportWorkbook = async (
    buffer: Buffer,
): Promise<ParsedEmployeeImportRow[]> => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
    );
    const workbookBuffer = arrayBuffer as unknown as Parameters<
        typeof workbook.xlsx.load
    >[0];

    try {
        await workbook.xlsx.load(workbookBuffer);
    } catch {
        throw new EmployeeImportFileError("Workbook is invalid or corrupted");
    }

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        throw new EmployeeImportFileError("Workbook must contain a worksheet");
    }

    const headerIndexMap = validateHeaders(worksheet);
    const rows: ParsedEmployeeImportRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const values = {} as Record<EmployeeImportField, EmployeeImportCellValue>;
        const errors: EmployeeImportRowError[] = [];

        headerIndexMap.forEach((columnIndex, field) => {
            const result = resolveCellValue(row.getCell(columnIndex), rowNumber, field);

            values[field] = result.value;

            if (result.error) {
                errors.push(result.error);
            }
        });

        const parsedRow = {
            rowNumber,
            values,
            errors,
        };

        if (!isEmptyRow(parsedRow)) {
            rows.push(parsedRow);
        }
    }

    if (rows.length === 0) {
        throw new EmployeeImportFileError("Import file must contain data rows");
    }

    if (rows.length > MAX_DATA_ROWS) {
        throw new EmployeeImportFileError(
            `Import file must not exceed ${MAX_DATA_ROWS} data rows`,
        );
    }

    return rows;
};
