import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { leaveRequestController } from "./leave-request.controller";

export const leaveRequestRoutes = Router();

leaveRequestRoutes.get(
    "/",
    authenticate,
    leaveRequestController.getLeaveRequests,
);

leaveRequestRoutes.post(
    "/",
    authenticate,
    leaveRequestController.createLeaveRequest,
);

leaveRequestRoutes.patch(
    "/:id/status",
    authenticate,
    requireRole("ADMIN"),
    leaveRequestController.updateLeaveRequestStatus,
);

leaveRequestRoutes.get(
    "/:id",
    authenticate,
    leaveRequestController.getLeaveRequestById,
);
