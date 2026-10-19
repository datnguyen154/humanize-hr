import { attendanceRepository } from "./attendance.repository";
import { AttendanceServiceError } from "./attendance.service";
import type { AttendanceMonthlyReport, AttendanceReportPeriod } from "./attendance-report.types";
import { generateAttendanceReportExcel } from "./attendance-report-excel.generator";

export const parseAttendanceReportPeriod = (year: unknown, month: unknown): AttendanceReportPeriod => {
    if (typeof year !== "string" || !/^\d{1,4}$/.test(year) || Number(year) < 1 || Number(year) > 9999) {
        throw new AttendanceServiceError("Invalid year", 400);
    }
    if (typeof month !== "string" || !/^\d{1,2}$/.test(month) || Number(month) < 1 || Number(month) > 12) {
        throw new AttendanceServiceError("Invalid month", 400);
    }
    return { year: Number(year), month: Number(month) };
};

export const attendanceReportService = {
    async getMonthlyReport(period: AttendanceReportPeriod): Promise<AttendanceMonthlyReport> {
        // setUTCFullYear avoids Date.UTC's special interpretation of years 0–99.
        const fromDate = new Date(0);
        fromDate.setUTCFullYear(period.year, period.month - 1, 1);
        const toDate = new Date(0);
        toDate.setUTCFullYear(period.year, period.month, 1);
        const employees = await attendanceRepository.getMonthlyReportRows(
            fromDate,
            toDate,
        );
        const totals = employees.reduce((result, employee) => ({
            totalEmployees: result.totalEmployees + 1,
            totalRecords: result.totalRecords + employee.totalRecords,
            present: result.present + employee.present,
            late: result.late + employee.late,
            missingCheckOut: result.missingCheckOut + employee.missingCheckOut,
        }), { totalEmployees: 0, totalRecords: 0, present: 0, late: 0, missingCheckOut: 0 });
        return { period, employees, totals };
    },

    async exportMonthlyReport(period: AttendanceReportPeriod) {
        const report = await attendanceReportService.getMonthlyReport(period);
        return {
            buffer: await generateAttendanceReportExcel(report),
            filename: `attendance-${period.year}-${String(period.month).padStart(2, "0")}.xlsx`,
        };
    },
};
