-- Add nullable approver assignment for existing leave requests.
ALTER TABLE "LeaveRequest" ADD COLUMN "approverId" UUID;

CREATE INDEX "LeaveRequest_approverId_status_idx"
ON "LeaveRequest"("approverId", "status");

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_approverId_fkey"
FOREIGN KEY ("approverId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
