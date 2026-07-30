import ExcelJS from "exceljs";

import type { EmployeeExportRow } from "./employee.repository";

const TEXT_FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

const sanitizeTextCell = (value: string | null | undefined): string => {
    if (value === null || value === undefined) {
        return "-";
    }

    const text = value;

    if (TEXT_FORMULA_PREFIX_PATTERN.test(text)) {
        return `'${text}`;
    }

    return text;
};

const formatEmployeeStatus = (status: string): string => {
    if (status === "ACTIVE") {
        return "Đang hoạt động";
    }

    if (status === "INACTIVE") {
        return "Ngừng hoạt động";
    }

    return status;
};

export const generateEmployeesExcel = async (
    employees: EmployeeExportRow[],
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    worksheet.columns = [
        { header: "Mã nhân viên", key: "employeeCode", width: 18 },
        { header: "Họ tên", key: "fullName", width: 28 },
        { header: "Email", key: "email", width: 32 },
        { header: "Số điện thoại", key: "phone", width: 18 },
        { header: "Chức vụ", key: "position", width: 24 },
        { header: "Phòng ban", key: "department", width: 24 },
        { header: "Trạng thái", key: "status", width: 18 },
        { header: "Ngày vào làm", key: "joinedAt", width: 16 },
    ];

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = {
        from: "A1",
        to: "H1",
    };

    worksheet.getRow(1).font = { bold: true };

    employees.forEach((employee) => {
        worksheet.addRow({
            employeeCode: sanitizeTextCell(employee.employeeCode),
            fullName: sanitizeTextCell(employee.fullName),
            email: sanitizeTextCell(employee.email),
            phone: sanitizeTextCell(employee.phone),
            position: sanitizeTextCell(employee.position),
            department: sanitizeTextCell(employee.department?.name),
            status: formatEmployeeStatus(employee.status),
            joinedAt: employee.joinedAt,
        });
    });

    worksheet.getColumn("joinedAt").numFmt = "dd/mm/yyyy";

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
};
