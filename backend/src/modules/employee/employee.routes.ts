import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { employeeController } from "./employee.controller";

export const employeeRoutes = Router();

employeeRoutes.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  employeeController.getEmployees,
);
