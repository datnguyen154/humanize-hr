import { NotificationEntityType, NotificationType } from "@prisma/client";

import {
    notificationRepository,
    type NotificationDbClient,
    type NotificationRow,
} from "./notification.repository";

type GetNotificationsQuery = {
    page?: number | string;
    limit?: number | string;
    unreadOnly?: string;
};

type NotificationsMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type NotificationsResult = {
    data: NotificationRow[];
    meta: NotificationsMeta;
};

type LeaveNotificationContext = {
    id: string;
    employeeFullName: string;
    startDate: Date;
    endDate: Date;
};

export class NotificationServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "NotificationServiceError";
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parsePositiveInteger = (
    value: number | string | undefined,
    defaultValue: number,
): number => {
    if (value === undefined || value === "") {
        return defaultValue;
    }

    const parsedValue = typeof value === "number" ? value : Number(value);

    return Number.isInteger(parsedValue) ? parsedValue : Number.NaN;
};

const normalizePagination = (
    pageInput: number | string | undefined,
    limitInput: number | string | undefined,
): { page: number; limit: number; skip: number; take: number } => {
    const page = parsePositiveInteger(pageInput, DEFAULT_PAGE);
    const limit = parsePositiveInteger(limitInput, DEFAULT_LIMIT);

    if (page < 1 || Number.isNaN(page)) {
        throw new NotificationServiceError("Invalid page", 400);
    }

    if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
        throw new NotificationServiceError("Invalid limit", 400);
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
};

const parseUnreadOnly = (value: string | undefined): boolean | undefined => {
    if (value === undefined || value === "") {
        return undefined;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new NotificationServiceError("Invalid unreadOnly", 400);
};

const pad = (value: number): string => String(value).padStart(2, "0");

const formatDate = (date: Date): string =>
    `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;

const requireUserId = (userId: string | undefined): string => {
    if (!userId || !UUID_REGEX.test(userId)) {
        throw new NotificationServiceError("Unauthorized", 401);
    }

    return userId;
};

const requireNotificationId = (id: string): string => {
    if (!UUID_REGEX.test(id)) {
        throw new NotificationServiceError("Notification not found", 404);
    }

    return id;
};

export const notificationService = {
    async getNotifications(
        userIdInput: string | undefined,
        query: GetNotificationsQuery,
    ): Promise<NotificationsResult> {
        const userId = requireUserId(userIdInput);
        const { page, limit, skip, take } = normalizePagination(
            query.page,
            query.limit,
        );
        const unreadOnly = parseUnreadOnly(query.unreadOnly);
        const params = { userId, skip, take, unreadOnly };

        const [notifications, totalItems] = await Promise.all([
            notificationRepository.findNotifications(params),
            notificationRepository.countNotifications(params),
        ]);
        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: notifications,
            meta: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0,
            },
        };
    },

    async getUnreadCount(userIdInput: string | undefined): Promise<number> {
        const userId = requireUserId(userIdInput);

        return notificationRepository.countUnreadNotifications(userId);
    },

    async markNotificationRead(
        userIdInput: string | undefined,
        id: string,
    ): Promise<NotificationRow> {
        const userId = requireUserId(userIdInput);
        const notificationId = requireNotificationId(id);
        const notification = await notificationRepository.markNotificationRead(
            notificationId,
            userId,
        );

        if (!notification) {
            throw new NotificationServiceError(
                "Notification not found",
                404,
            );
        }

        return notification;
    },

    async markAllNotificationsRead(
        userIdInput: string | undefined,
    ): Promise<number> {
        const userId = requireUserId(userIdInput);
        const result = await notificationRepository.markAllNotificationsRead(
            userId,
        );

        return result.count;
    },

    createLeaveRequestCreatedNotification(
        recipientUserId: string,
        context: LeaveNotificationContext,
        db?: NotificationDbClient,
    ) {
        return notificationRepository.createNotification(
            {
                userId: recipientUserId,
                type: NotificationType.LEAVE_REQUEST_CREATED,
                title: "Có đơn nghỉ phép mới",
                message: `${context.employeeFullName} vừa gửi một đơn nghỉ phép.`,
                entityType: NotificationEntityType.LEAVE_REQUEST,
                entityId: context.id,
            },
            db,
        );
    },

    createLeaveRequestDecisionNotification(
        recipientUserId: string,
        context: LeaveNotificationContext,
        approved: boolean,
        db?: NotificationDbClient,
    ) {
        const type = approved
            ? NotificationType.LEAVE_REQUEST_APPROVED
            : NotificationType.LEAVE_REQUEST_REJECTED;
        const title = approved
            ? "Đơn nghỉ phép đã được duyệt"
            : "Đơn nghỉ phép đã bị từ chối";
        const decision = approved ? "đã được duyệt" : "đã bị từ chối";

        return notificationRepository.createNotification(
            {
                userId: recipientUserId,
                type,
                title,
                message: `Đơn nghỉ phép của bạn từ ${formatDate(context.startDate)} đến ${formatDate(context.endDate)} ${decision}.`,
                entityType: NotificationEntityType.LEAVE_REQUEST,
                entityId: context.id,
            },
            db,
        );
    },

    createLeaveRequestAssignedNotification(
        recipientUserId: string,
        context: LeaveNotificationContext,
        db?: NotificationDbClient,
    ) {
        return notificationRepository.createNotification(
            {
                userId: recipientUserId,
                type: NotificationType.LEAVE_REQUEST_ASSIGNED,
                title: "Bạn được phân công duyệt một đơn nghỉ phép",
                message: `Bạn được phân công duyệt đơn nghỉ phép của ${context.employeeFullName}.`,
                entityType: NotificationEntityType.LEAVE_REQUEST,
                entityId: context.id,
            },
            db,
        );
    },
};
