import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { notificationController } from "./notification.controller";

export const notificationRoutes = Router();

const notificationAccess = [
    authenticate,
    requireRole("ADMIN", "EMPLOYEE"),
];

notificationRoutes.get(
    "/unread-count",
    ...notificationAccess,
    notificationController.getUnreadCount,
);

notificationRoutes.patch(
    "/read-all",
    ...notificationAccess,
    notificationController.markAllNotificationsRead,
);

notificationRoutes.patch(
    "/:id/read",
    ...notificationAccess,
    notificationController.markNotificationRead,
);

notificationRoutes.get(
    "/",
    ...notificationAccess,
    notificationController.getNotifications,
);
