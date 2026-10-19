import ExcelJS from "exceljs";
import type { AttendanceMonthlyReport } from "./attendance-report.types";

export async function generateAttendanceReportExcel(report: AttendanceMonthlyReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Chấm công tháng");
    sheet.columns = [
        { header: "Kỳ báo cáo", key: "period", width: 16 },
        { header: "Mã nhân viên", key: "employeeCode", width: 18 },
        { header: "Họ tên", key: "fullName", width: 30 },
        { header: "Số lần chấm công", key: "totalRecords", width: 22 },
        { header: "Đúng giờ", key: "present", width: 16 },
        { header: "Đi muộn", key: "late", width: 16 },
        { header: "Chưa check-out", key: "missingCheckOut", width: 22 },
    ];
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:G1";
    sheet.getRow(1).font = { bold: true };
    const period = `${String(report.period.month).padStart(2, "0")}/${report.period.year}`;
    for (const employee of report.employees) {
        // Keep user-controlled text literal, following the existing employee export pattern.
        const text = (value: string) => /^[=+\-@]/.test(value) ? `'${value}` : value;
        sheet.addRow({ ...employee, period, employeeCode: text(employee.employeeCode), fullName: text(employee.fullName) });
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
}
