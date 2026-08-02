import ExcelJS from "exceljs";

import { EMPLOYEE_IMPORT_HEADERS } from "./employee-import.parser";

const TEMPLATE_FILENAME = "employee-import-template.xlsx";

export const generateEmployeeImportTemplate = async (): Promise<{
    buffer: Buffer;
    filename: string;
}> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    worksheet.columns = [
        { header: EMPLOYEE_IMPORT_HEADERS[0], key: "employeeCode", width: 18 },
        { header: EMPLOYEE_IMPORT_HEADERS[1], key: "fullName", width: 28 },
        { header: EMPLOYEE_IMPORT_HEADERS[2], key: "email", width: 32 },
        { header: EMPLOYEE_IMPORT_HEADERS[3], key: "phone", width: 18 },
        { header: EMPLOYEE_IMPORT_HEADERS[4], key: "position", width: 24 },
        { header: EMPLOYEE_IMPORT_HEADERS[5], key: "department", width: 24 },
        { header: EMPLOYEE_IMPORT_HEADERS[6], key: "status", width: 22 },
        { header: EMPLOYEE_IMPORT_HEADERS[7], key: "joinedAt", width: 16 },
    ];

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = {
        from: "A1",
        to: "H1",
    };
    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn("joinedAt").numFmt = "dd/mm/yyyy";

    const guideSheet = workbook.addWorksheet("Hướng dẫn");
    guideSheet.columns = [{ header: "Hướng dẫn import", width: 100 }];
    guideSheet.addRows([
        ["Chỉ dùng file .xlsx."],
        ["Không đổi tên header."],
        ["Có thể đổi thứ tự cột, backend sẽ map theo tên header."],
        ["Phòng ban có thể để trống. Nếu nhập, phải đúng tên phòng ban đang tồn tại trong hệ thống."],
        ["Trạng thái hợp lệ: ACTIVE, INACTIVE, Đang hoạt động, Ngừng hoạt động."],
        ["Ngày vào làm dùng định dạng DD/MM/YYYY hoặc ô ngày thật của Excel."],
        ["Công thức được phép nếu Excel/WPS đã tính kết quả và file đã được lưu."],
        ["Backend không tự tính công thức Excel."],
        ["Dữ liệu thực tế phải được nhập trong worksheet \"Employees\"."],
        ["Không copy nguyên dữ liệu mẫu bên dưới nếu không muốn import nó."],
        [""],
        ["Ví dụ"],
        [
            "Mã nhân viên",
            "Họ tên",
            "Email",
            "Số điện thoại",
            "Chức vụ",
            "Phòng ban",
            "Trạng thái",
            "Ngày vào làm",
        ],
        [
            "EMP999",
            "Nguyễn Văn A",
            "nguyen.van.a@example.com",
            "0901234567",
            "Frontend Developer",
            "Engineering",
            "Đang hoạt động",
            "15/01/2026",
        ],
    ]);
    guideSheet.getRow(1).font = { bold: true };
    guideSheet.getRow(13).font = { bold: true };
    guideSheet.getRow(14).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    return {
        buffer: Buffer.from(buffer),
        filename: TEMPLATE_FILENAME,
    };
};
