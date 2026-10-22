import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { workScheduleController as controller } from "./work-schedule.controller";

export const workScheduleRoutes = Router();
workScheduleRoutes.use(authenticate, requireRole("ADMIN"));
workScheduleRoutes.get("/versions", controller.list);
workScheduleRoutes.get("/versions/:id", controller.getById);
workScheduleRoutes.post("/versions", controller.create);
workScheduleRoutes.patch("/versions/:id", controller.update);
