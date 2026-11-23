ALTER TYPE "WorkScheduleAuditAction" ADD VALUE 'EXCEPTION_CREATE';
ALTER TYPE "WorkScheduleAuditAction" ADD VALUE 'EXCEPTION_UPDATE';
ALTER TYPE "WorkScheduleAuditAction" ADD VALUE 'EXCEPTION_DELETE';

CREATE TYPE "CalendarExceptionKind" AS ENUM ('HOLIDAY', 'COMPENSATORY_OFF', 'SWAP', 'WORK_OVERRIDE');

CREATE TABLE "CalendarException" (
    "id" UUID NOT NULL,
    "scheduleVersionId" UUID NOT NULL,
    "kind" "CalendarExceptionKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "firstAffectedDate" DATE NOT NULL,
    "lastAffectedDate" DATE NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarException_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarException_dates_check" CHECK (
        "firstAffectedDate" <= "lastAffectedDate"
        AND "firstAffectedDate" >= DATE '0001-01-01'
        AND "lastAffectedDate" <= DATE '9999-12-31'
    ),
    CONSTRAINT "CalendarException_payload_check" CHECK (
        jsonb_typeof("payload") = 'object' AND "payload" ? 'kind'
        AND "payload"->>'kind' = "kind"::text
    )
);
CREATE INDEX "CalendarException_scheduleVersionId_firstAffectedDate_id_idx"
    ON "CalendarException"("scheduleVersionId", "firstAffectedDate", "id");
ALTER TABLE "CalendarException" ADD CONSTRAINT "CalendarException_scheduleVersionId_fkey"
    FOREIGN KEY ("scheduleVersionId") REFERENCES "WorkScheduleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarException" ADD CONSTRAINT "CalendarException_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarException" ADD CONSTRAINT "CalendarException_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
