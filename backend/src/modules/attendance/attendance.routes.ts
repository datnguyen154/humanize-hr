import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { attendanceController } from "./attendance.controller";
import { attendanceAdjustmentController } from "./attendance-adjustment.controller";

export const attendanceRoutes = Router();

attendanceRoutes.get("/adjustment-requests", authenticate, requireRole("ADMIN", "EMPLOYEE"), attendanceAdjustmentController.list);
attendanceRoutes.post("/adjustment-requests", authenticate, requireRole("EMPLOYEE"), attendanceAdjustmentController.create);
attendanceRoutes.get("/adjustment-requests/:id", authenticate, requireRole("ADMIN", "EMPLOYEE"), attendanceAdjustmentController.getById);
attendanceRoutes.patch("/adjustment-requests/:id/review", authenticate, requireRole("ADMIN"), attendanceAdjustmentController.review);

attendanceRoutes.get("/monthly-report", authenticate, requireRole("ADMIN"), attendanceController.getMonthlyReport);
attendanceRoutes.get("/monthly-report/export", authenticate, requireRole("ADMIN"), attendanceController.exportMonthlyReport);

attendanceRoutes.post(
    "/check-in",
    authenticate,
    requireRole("EMPLOYEE"),
    attendanceController.checkIn,
);

attendanceRoutes.post(
    "/check-out",
    authenticate,
    requireRole("EMPLOYEE"),
    attendanceController.checkOut,
);

attendanceRoutes.get(
    "/history",
    authenticate,
    requireRole("EMPLOYEE"),
    attendanceController.getAttendanceHistory,
);

attendanceRoutes.get(
    "/",
    authenticate,
    requireRole("ADMIN"),
    attendanceController.getAttendanceRecords,
);
