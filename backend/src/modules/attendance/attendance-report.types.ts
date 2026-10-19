export type AttendanceReportPeriod = { year: number; month: number };

export type AttendanceReportCounts = {
    totalRecords: number;
    present: number;
    late: number;
    missingCheckOut: number;
};

export type AttendanceReportRow = AttendanceReportCounts & {
    employeeId: string;
    employeeCode: string;
    fullName: string;
};

export type AttendanceMonthlyReport = {
    period: AttendanceReportPeriod;
    employees: AttendanceReportRow[];
    totals: AttendanceReportCounts & { totalEmployees: number };
};
