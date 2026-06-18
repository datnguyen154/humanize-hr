import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { authRoutes } from "./modules/auth/auth.routes";
import { departmentRoutes } from "./modules/department/department.routes";
import { employeeRoutes } from "./modules/employee/employee.routes";
import { leaveRequestRoutes } from "./modules/leave-request/leave-request.routes";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    message: "HRM backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);

export default app;
