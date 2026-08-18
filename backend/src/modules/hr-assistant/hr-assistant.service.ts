import { AttendanceStatus, LeaveRequestStatus } from "@prisma/client";

import { attendanceRepository } from "../attendance/attendance.repository";
import { getCompanyDateContext } from "../attendance/attendance.service";
import { employeeRepository } from "../employee/employee.repository";
import { leaveRequestRepository } from "../leave-request/leave-request.repository";
import { payrollRepository } from "../payroll/payroll.repository";
import { QUESTION_REGISTRY, questionKeys, staticAnswers } from "./hr-assistant.constants";
import type { AssistantAnswer, QuestionKey } from "./hr-assistant.types";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMPANY_TIME_ZONE = "Asia/Bangkok";

export class HrAssistantServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "HrAssistantServiceError";
    }
}

const formatTime = (date: Date): string =>
    new Intl.DateTimeFormat("vi-VN", {
        timeZone: COMPANY_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);

const formatDate = (date: Date): string =>
    new Intl.DateTimeFormat("vi-VN", {
        timeZone: COMPANY_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);

const getEmployeeProfile = async (userId: string | undefined) => {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new HrAssistantServiceError("Employee profile not found", 404);
    }

    const employee = await employeeRepository.findEmployeeProfileByUserId(userId);

    if (!employee) {
        throw new HrAssistantServiceError("Employee profile not found", 404);
    }

    return employee;
};

const getCurrentBangkokMonthRange = (): { fromDate: Date; toDate: Date } => {
    const { attendanceDate } = getCompanyDateContext(new Date());
    const year = attendanceDate.getUTCFullYear();
    const month = attendanceDate.getUTCMonth();

    return {
        fromDate: new Date(Date.UTC(year, month, 1)),
        toDate: new Date(Date.UTC(year, month + 1, 1)),
    };
};

const getTodayAttendanceAnswer = async (employeeId: string): Promise<string> => {
    const { attendanceDate } = getCompanyDateContext(new Date());
    const attendance = await attendanceRepository.findAttendanceByEmployeeAndDate(
        employeeId,
        attendanceDate,
    );

    if (!attendance) {
        return "Hôm nay bạn chưa chấm công.";
    }

    const checkIn = `Bạn đã chấm công lúc ${formatTime(attendance.checkInTime)}.`;

    if (!attendance.checkOutTime) {
        return `${checkIn} Bạn chưa chấm công ra.`;
    }

    return `${checkIn} Bạn đã chấm công ra lúc ${formatTime(attendance.checkOutTime)}.`;
};

const getTodayLateAnswer = async (employeeId: string): Promise<string> => {
    const { attendanceDate } = getCompanyDateContext(new Date());
    const attendance = await attendanceRepository.findAttendanceByEmployeeAndDate(
        employeeId,
        attendanceDate,
    );

    if (!attendance) {
        return "Hôm nay bạn chưa chấm công.";
    }

    const checkIn = formatTime(attendance.checkInTime);

    if (attendance.status === AttendanceStatus.LATE) {
        return `Hôm nay bạn đi muộn. Giờ chấm công vào: ${checkIn}.`;
    }

    return `Hôm nay bạn không đi muộn. Giờ chấm công vào: ${checkIn}.`;
};

const getCurrentMonthLateAnswer = async (employeeId: string): Promise<string> => {
    const { fromDate, toDate } = getCurrentBangkokMonthRange();
    const lateCount = await attendanceRepository.countLateAttendance(
        employeeId,
        fromDate,
        toDate,
    );

    if (lateCount === 0) {
        return "Tháng này bạn chưa có lần đi muộn nào.";
    }

    return `Tháng này bạn đã đi muộn ${lateCount} lần.`;
};

const getLatestPayrollAnswer = async (employeeId: string): Promise<string> => {
    const [latestPayroll] = await payrollRepository.findEmployeePayrolls({
        employeeId,
        skip: 0,
        take: 1,
    });

    if (!latestPayroll) {
        return "Bạn chưa có bảng lương đã phát hành.";
    }

    return `Bảng lương gần nhất của bạn là tháng ${latestPayroll.month}/${latestPayroll.year}.`;
};

const leaveStatusLabels: Record<LeaveRequestStatus, string> = {
    PENDING: "Đang chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Đã từ chối",
};

const getLatestLeaveRequestAnswer = async (employeeId: string): Promise<string> => {
    const [latestLeaveRequest] = await leaveRequestRepository.findLeaveRequests({
        employeeId,
        skip: 0,
        take: 1,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    if (!latestLeaveRequest) {
        return "Bạn chưa có đơn nghỉ phép nào.";
    }

    const status = leaveStatusLabels[latestLeaveRequest.status];
    const startDate = formatDate(latestLeaveRequest.startDate);
    const endDate = formatDate(latestLeaveRequest.endDate);

    return `Đơn nghỉ phép gần nhất của bạn đang ${status}, từ ngày ${startDate} đến ngày ${endDate}.`;
};

export const hrAssistantService = {
    getQuestions() {
        return QUESTION_REGISTRY;
    },

    async query(
        userId: string | undefined,
        questionKeyInput: unknown,
    ): Promise<AssistantAnswer> {
        if (typeof questionKeyInput !== "string" || !questionKeyInput.trim()) {
            throw new HrAssistantServiceError("questionKey is required", 400);
        }

        const questionKeyValue = questionKeyInput.trim();

        if (!questionKeys.has(questionKeyValue as QuestionKey)) {
            throw new HrAssistantServiceError("Unsupported questionKey", 400);
        }

        const questionKey = questionKeyValue as QuestionKey;
        const staticAnswer = staticAnswers[questionKey];

        if (staticAnswer) {
            return {
                questionKey,
                answer: staticAnswer,
                type: "TEXT",
            };
        }

        const employee = await getEmployeeProfile(userId);
        let answer: string;

        switch (questionKey) {
            case "TODAY_ATTENDANCE_STATUS":
                answer = await getTodayAttendanceAnswer(employee.id);
                break;
            case "TODAY_LATE_STATUS":
                answer = await getTodayLateAnswer(employee.id);
                break;
            case "CURRENT_MONTH_LATE_COUNT":
                answer = await getCurrentMonthLateAnswer(employee.id);
                break;
            case "MY_DEPARTMENT":
                answer = employee.department
                    ? `Bạn hiện thuộc phòng ban ${employee.department.name}.`
                    : "Bạn hiện chưa được phân phòng ban.";
                break;
            case "LATEST_PAYROLL":
                answer = await getLatestPayrollAnswer(employee.id);
                break;
            case "LATEST_LEAVE_REQUEST":
                answer = await getLatestLeaveRequestAnswer(employee.id);
                break;
            default:
                throw new HrAssistantServiceError("Unsupported questionKey", 400);
        }

        return {
            questionKey,
            answer,
            type: "TEXT",
        };
    },
};
