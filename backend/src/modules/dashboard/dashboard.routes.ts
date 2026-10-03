import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { dashboardController } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.get(
    "/admin",
    authenticate,
    requireRole("ADMIN"),
    dashboardController.getAdminDashboard,
);

dashboardRoutes.get(
    "/employee",
    authenticate,
    requireRole("EMPLOYEE"),
    dashboardController.getEmployeeDashboard,
);
