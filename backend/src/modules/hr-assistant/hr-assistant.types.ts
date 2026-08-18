export const QUESTION_KEYS = [
    "TODAY_ATTENDANCE_STATUS",
    "TODAY_LATE_STATUS",
    "CURRENT_MONTH_LATE_COUNT",
    "MY_DEPARTMENT",
    "LATEST_PAYROLL",
    "LATEST_LEAVE_REQUEST",
    "HOW_TO_REQUEST_LEAVE",
    "WHERE_TO_VIEW_PAYROLL",
    "WHERE_TO_VIEW_ATTENDANCE",
] as const;

export type QuestionKey = (typeof QUESTION_KEYS)[number];

export type QuestionDefinition = {
    key: QuestionKey;
    label: string;
};

export type AssistantAnswer = {
    questionKey: QuestionKey;
    answer: string;
    type: "TEXT";
};
