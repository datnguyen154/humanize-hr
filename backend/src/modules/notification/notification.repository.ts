import type {
    Notification,
    NotificationEntityType,
    NotificationType,
    Prisma,
} from "@prisma/client";

import { prisma } from "../../config/prisma";

export type NotificationQueryParams = {
    userId: string;
    skip: number;
    take: number;
    unreadOnly?: boolean;
};

export type CreateNotificationData = Prisma.NotificationUncheckedCreateInput;
export type NotificationDbClient = Prisma.TransactionClient;

const notificationSelect = {
    id: true,
    type: true,
    title: true,
    message: true,
    entityType: true,
    entityId: true,
    isRead: true,
    createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRow = Prisma.NotificationGetPayload<{
    select: typeof notificationSelect;
}>;

const buildNotificationWhere = (
    params: NotificationQueryParams,
): Prisma.NotificationWhereInput => ({
    userId: params.userId,
    ...(params.unreadOnly ? { isRead: false } : {}),
});

const getDb = (db?: NotificationDbClient) => db ?? prisma;

export const notificationRepository = {
    findNotifications(
        params: NotificationQueryParams,
    ): Promise<NotificationRow[]> {
        return prisma.notification.findMany({
            where: buildNotificationWhere(params),
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
            select: notificationSelect,
        });
    },

    countNotifications(params: NotificationQueryParams): Promise<number> {
        return prisma.notification.count({
            where: buildNotificationWhere(params),
        });
    },

    countUnreadNotifications(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    },

    findNotificationByIdForUser(
        id: string,
        userId: string,
    ): Promise<NotificationRow | null> {
        return prisma.notification.findFirst({
            where: { id, userId },
            select: notificationSelect,
        });
    },

    async markNotificationRead(
        id: string,
        userId: string,
    ): Promise<NotificationRow | null> {
        await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });

        return this.findNotificationByIdForUser(id, userId);
    },

    markAllNotificationsRead(userId: string): Promise<{ count: number }> {
        return prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
    },

    createNotification(
        data: CreateNotificationData,
        db?: NotificationDbClient,
    ): Promise<Notification> {
        return getDb(db).notification.create({ data });
    },
};

export type { NotificationEntityType, NotificationType };
