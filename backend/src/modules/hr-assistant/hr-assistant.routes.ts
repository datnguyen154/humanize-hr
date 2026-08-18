import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { hrAssistantController } from "./hr-assistant.controller";

export const hrAssistantRoutes = Router();

hrAssistantRoutes.get(
    "/questions",
    authenticate,
    requireRole("EMPLOYEE"),
    hrAssistantController.getQuestions,
);

hrAssistantRoutes.post(
    "/query",
    authenticate,
    requireRole("EMPLOYEE"),
    hrAssistantController.query,
);
