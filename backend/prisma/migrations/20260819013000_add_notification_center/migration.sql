-- Create notification enums.
CREATE TYPE "NotificationType" AS ENUM (
    'LEAVE_REQUEST_CREATED',
    'LEAVE_REQUEST_APPROVED',
    'LEAVE_REQUEST_REJECTED',
    'LEAVE_REQUEST_ASSIGNED'
);

CREATE TYPE "NotificationEntityType" AS ENUM ('LEAVE_REQUEST');

-- Create notification inbox records.
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" "NotificationEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_createdAt_idx"
ON "Notification"("userId", "createdAt");

CREATE INDEX "Notification_userId_isRead_idx"
ON "Notification"("userId", "isRead");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
