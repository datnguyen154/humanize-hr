CREATE TYPE "AttendanceAdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "AttendanceAdjustmentRequest" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "attendanceId" UUID,
    "attendanceDate" DATE NOT NULL,
    "originalCheckInTime" TIMESTAMP(3),
    "originalCheckOutTime" TIMESTAMP(3),
    "originalUpdatedAt" TIMESTAMP(3),
    "requestedCheckInTime" TIMESTAMP(3) NOT NULL,
    "requestedCheckOutTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "AttendanceAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceAdjustmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AttendanceAdjustmentRequest_employeeId_createdAt_idx" ON "AttendanceAdjustmentRequest"("employeeId", "createdAt");
CREATE INDEX "AttendanceAdjustmentRequest_employeeId_attendanceDate_idx" ON "AttendanceAdjustmentRequest"("employeeId", "attendanceDate");
CREATE INDEX "AttendanceAdjustmentRequest_attendanceId_idx" ON "AttendanceAdjustmentRequest"("attendanceId");
CREATE INDEX "AttendanceAdjustmentRequest_status_createdAt_idx" ON "AttendanceAdjustmentRequest"("status", "createdAt");
CREATE INDEX "AttendanceAdjustmentRequest_reviewedBy_idx" ON "AttendanceAdjustmentRequest"("reviewedBy");
CREATE UNIQUE INDEX "AttendanceAdjustmentRequest_one_pending_per_day_idx"
    ON "AttendanceAdjustmentRequest"("employeeId", "attendanceDate") WHERE "status" = 'PENDING';

ALTER TABLE "AttendanceAdjustmentRequest" ADD CONSTRAINT "AttendanceAdjustmentRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceAdjustmentRequest" ADD CONSTRAINT "AttendanceAdjustmentRequest_attendanceId_fkey"
    FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceAdjustmentRequest" ADD CONSTRAINT "AttendanceAdjustmentRequest_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
