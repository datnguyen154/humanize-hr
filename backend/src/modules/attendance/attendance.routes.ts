import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { attendanceController } from "./attendance.controller";

export const attendanceRoutes = Router();

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
