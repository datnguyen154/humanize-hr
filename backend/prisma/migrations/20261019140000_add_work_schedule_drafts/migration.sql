CREATE TYPE "WorkScheduleStatus" AS ENUM ('DRAFT', 'ACTIVE');
CREATE TYPE "WorkScheduleAuditAction" AS ENUM ('CREATE', 'UPDATE');

CREATE TABLE "WorkScheduleVersion" (
    "id" UUID NOT NULL,
    "version" SERIAL NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "WorkScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "weekdays" INTEGER[] NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakStartMinute" INTEGER NOT NULL,
    "breakEndMinute" INTEGER NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkScheduleVersion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkScheduleVersion_revision_check" CHECK ("revision" > 0),
    CONSTRAINT "WorkScheduleVersion_timezone_check" CHECK ("timezone" = 'Asia/Ho_Chi_Minh'),
    CONSTRAINT "WorkScheduleVersion_weekdays_check" CHECK (
        cardinality("weekdays") BETWEEN 1 AND 7 AND array_ndims("weekdays") = 1
        AND array_position("weekdays", NULL) IS NULL
        AND "weekdays" <@ ARRAY[1,2,3,4,5,6,7]
    ),
    CONSTRAINT "WorkScheduleVersion_times_check" CHECK (
        0 <= "startMinute" AND "startMinute" < "breakStartMinute"
        AND "breakStartMinute" < "breakEndMinute"
        AND "breakEndMinute" < "endMinute" AND "endMinute" < 1440
    )
);
CREATE UNIQUE INDEX "WorkScheduleVersion_version_key" ON "WorkScheduleVersion"("version");
CREATE INDEX "WorkScheduleVersion_status_version_idx" ON "WorkScheduleVersion"("status", "version");

CREATE TABLE "WorkScheduleAudit" (
    "id" UUID NOT NULL,
    "scheduleVersionId" UUID NOT NULL,
    "action" "WorkScheduleAuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "actorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkScheduleAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkScheduleAudit_scheduleVersionId_createdAt_idx" ON "WorkScheduleAudit"("scheduleVersionId", "createdAt");
ALTER TABLE "WorkScheduleVersion" ADD CONSTRAINT "WorkScheduleVersion_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkScheduleVersion" ADD CONSTRAINT "WorkScheduleVersion_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkScheduleAudit" ADD CONSTRAINT "WorkScheduleAudit_scheduleVersionId_fkey"
    FOREIGN KEY ("scheduleVersionId") REFERENCES "WorkScheduleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkScheduleAudit" ADD CONSTRAINT "WorkScheduleAudit_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
