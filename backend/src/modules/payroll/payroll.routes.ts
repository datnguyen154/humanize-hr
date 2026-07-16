import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { payrollController } from "./payroll.controller";

export const payrollRoutes = Router();

payrollRoutes.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    payrollController.createPayroll,
);
