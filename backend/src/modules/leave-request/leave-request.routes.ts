import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { leaveRequestController } from "./leave-request.controller";

export const leaveRequestRoutes = Router();

leaveRequestRoutes.get(
    "/approvers",
    authenticate,
    requireRole("EMPLOYEE"),
    leaveRequestController.getEligibleApprovers,
);

leaveRequestRoutes.get(
    "/",
    authenticate,
    leaveRequestController.getLeaveRequests,
);

leaveRequestRoutes.post(
    "/",
    authenticate,
    requireRole("EMPLOYEE"),
    leaveRequestController.createLeaveRequest,
);

leaveRequestRoutes.patch(
    "/:id/status",
    authenticate,
    requireRole("ADMIN"),
    leaveRequestController.updateLeaveRequestStatus,
);

leaveRequestRoutes.patch(
    "/:id/approver",
    authenticate,
    requireRole("ADMIN"),
    leaveRequestController.reassignLeaveRequest,
);

leaveRequestRoutes.get(
    "/:id",
    authenticate,
    leaveRequestController.getLeaveRequestById,
);
