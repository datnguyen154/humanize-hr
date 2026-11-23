ALTER TYPE "WorkScheduleAuditAction" ADD VALUE 'ACTIVATE';

ALTER TABLE "Attendance" ADD COLUMN "outOfSchedule" BOOLEAN NOT NULL DEFAULT false;
