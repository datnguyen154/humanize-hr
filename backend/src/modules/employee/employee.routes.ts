import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { uploadEmployeeImportFile } from "../../middlewares/upload.middleware";
import { payrollController } from "../payroll/payroll.controller";
import { employeeController } from "./employee.controller";

export const employeeRoutes = Router();

employeeRoutes.get(
    "/me/payrolls/:id/pdf",
    authenticate,
    requireRole("EMPLOYEE"),
    payrollController.downloadMyPayrollPdf,
);

employeeRoutes.get(
    "/me/payrolls",
    authenticate,
    requireRole("EMPLOYEE"),
    payrollController.getMyPayrolls,
);

employeeRoutes.get("/me", authenticate, employeeController.getMyProfile);

employeeRoutes.get(
    "/",
    authenticate,
    requireRole("ADMIN"),
    employeeController.getEmployees,
);

employeeRoutes.get(
    "/export",
    authenticate,
    requireRole("ADMIN"),
    employeeController.exportEmployees,
);

employeeRoutes.get(
    "/import-template",
    authenticate,
    requireRole("ADMIN"),
    employeeController.getEmployeeImportTemplate,
);

employeeRoutes.post(
    "/import-preview",
    authenticate,
    requireRole("ADMIN"),
    uploadEmployeeImportFile,
    employeeController.previewEmployeeImport,
);

employeeRoutes.post(
    "/import",
    authenticate,
    requireRole("ADMIN"),
    uploadEmployeeImportFile,
    employeeController.importEmployees,
);

employeeRoutes.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    employeeController.createEmployee,
);

employeeRoutes.get(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    employeeController.getEmployeeById,
);

employeeRoutes.patch(
    "/:id/status",
    authenticate,
    requireRole("ADMIN"),
    employeeController.updateEmployeeStatus,
);

employeeRoutes.patch(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    employeeController.updateEmployee,
);
