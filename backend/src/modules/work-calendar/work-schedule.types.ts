export type WorkScheduleConfig = {
    effectiveFrom: string;
    timezone: "Asia/Ho_Chi_Minh";
    weekdays: number[];
    startTime: string;
    endTime: string;
    breaks: [{ startTime: string; endTime: string }];
};

export type WorkScheduleDto = WorkScheduleConfig & {
    id: string;
    version: number;
    revision: number;
    status: "DRAFT" | "ACTIVE";
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
};
