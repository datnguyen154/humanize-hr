import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { departmentController } from "./department.controller";

export const departmentRoutes = Router();

departmentRoutes.get(
    "/",
    authenticate,
    requireRole("ADMIN"),
    departmentController.getDepartments,
);

departmentRoutes.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    departmentController.createDepartment,
);

departmentRoutes.get(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    departmentController.getDepartmentById,
);

departmentRoutes.patch(
    "/:id/status",
    authenticate,
    requireRole("ADMIN"),
    departmentController.updateDepartmentStatus,
);

departmentRoutes.patch(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    departmentController.updateDepartment,
);
