import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { attendanceRoutes } from "./modules/attendance/attendance.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { departmentRoutes } from "./modules/department/department.routes";
import { employeeRoutes } from "./modules/employee/employee.routes";
import { leaveRequestRoutes } from "./modules/leave-request/leave-request.routes";
import { hrAssistantRoutes } from "./modules/hr-assistant/hr-assistant.routes";
import { payrollRoutes } from "./modules/payroll/payroll.routes";
import { notificationRoutes } from "./modules/notification/notification.routes";

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://humanize-hr.vercel.app",
];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/attendance", attendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payrolls", payrollRoutes);
app.use("/api/hr-assistant", hrAssistantRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
