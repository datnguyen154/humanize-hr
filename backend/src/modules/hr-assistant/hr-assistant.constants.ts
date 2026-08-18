import type { QuestionKey, QuestionDefinition } from "./hr-assistant.types";

export const QUESTION_REGISTRY: readonly QuestionDefinition[] = [
    { key: "TODAY_ATTENDANCE_STATUS", label: "Hôm nay tôi đã chấm công chưa?" },
    { key: "TODAY_LATE_STATUS", label: "Hôm nay tôi có đi muộn không?" },
    { key: "CURRENT_MONTH_LATE_COUNT", label: "Tháng này tôi đi muộn bao nhiêu lần?" },
    { key: "MY_DEPARTMENT", label: "Tôi thuộc phòng ban nào?" },
    { key: "LATEST_PAYROLL", label: "Bảng lương gần nhất của tôi là tháng nào?" },
    { key: "LATEST_LEAVE_REQUEST", label: "Đơn nghỉ phép gần nhất của tôi đang ở trạng thái gì?" },
    { key: "HOW_TO_REQUEST_LEAVE", label: "Làm thế nào để gửi đơn nghỉ phép?" },
    { key: "WHERE_TO_VIEW_PAYROLL", label: "Tôi xem bảng lương ở đâu?" },
    { key: "WHERE_TO_VIEW_ATTENDANCE", label: "Tôi xem lịch sử chấm công ở đâu?" },
] as const satisfies readonly QuestionDefinition[];

export const questionKeys = new Set<QuestionKey>(
    QUESTION_REGISTRY.map((question) => question.key),
);

export const staticAnswers: Partial<Record<QuestionKey, string>> = {
    HOW_TO_REQUEST_LEAVE: "Bạn vào khu vực Nghỉ phép, chọn Tạo đơn nghỉ phép, điền thông tin và gửi đơn để chờ phê duyệt.",
    WHERE_TO_VIEW_PAYROLL: "Bạn xem bảng lương trong khu vực Bảng lương của mình.",
    WHERE_TO_VIEW_ATTENDANCE: "Bạn xem lịch sử chấm công trong khu vực Chấm công.",
};
