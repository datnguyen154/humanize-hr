import type { Request, Response } from "express";

import {
    NotificationServiceError,
    notificationService,
} from "./notification.service";

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }

    return undefined;
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof NotificationServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const notificationController = {
    async getNotifications(req: Request, res: Response): Promise<Response> {
        try {
            const result = await notificationService.getNotifications(
                req.user?.userId,
                {
                    page: getSingleQueryValue(req.query.page),
                    limit: getSingleQueryValue(req.query.limit),
                    unreadOnly: getSingleQueryValue(req.query.unreadOnly),
                },
            );

            return res.status(200).json(result);
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getUnreadCount(req: Request, res: Response): Promise<Response> {
        try {
            const count = await notificationService.getUnreadCount(
                req.user?.userId,
            );

            return res.status(200).json({
                data: { count },
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async markNotificationRead(req: Request, res: Response): Promise<Response> {
        try {
            const notification =
                await notificationService.markNotificationRead(
                    req.user?.userId,
                    req.params.id,
                );

            return res.status(200).json({
                data: notification,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async markAllNotificationsRead(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const updatedCount =
                await notificationService.markAllNotificationsRead(
                    req.user?.userId,
                );

            return res.status(200).json({
                data: { updatedCount },
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
