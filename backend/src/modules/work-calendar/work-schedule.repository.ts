import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const workScheduleRepository = {
    list(skip: number, take: number) {
        return prisma.$transaction(async (tx) => {
            const where = { status: "DRAFT" as const };
            const data = await tx.workScheduleVersion.findMany({
                where, skip, take, orderBy: { version: "desc" },
            });
            const totalItems = await tx.workScheduleVersion.count({ where });
            return { data, totalItems };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    },
    findById(id: string, db: Prisma.TransactionClient = prisma) {
        return db.workScheduleVersion.findUnique({ where: { id } });
    },
    create(data: Prisma.WorkScheduleVersionUncheckedCreateInput, db: Prisma.TransactionClient) {
        return db.workScheduleVersion.create({ data });
    },
    updateDraft(id: string, revision: number, data: Prisma.WorkScheduleVersionUncheckedUpdateManyInput, db: Prisma.TransactionClient) {
        return db.workScheduleVersion.updateMany({
            where: { id, revision, status: "DRAFT" }, data,
        });
    },
    audit(data: Prisma.WorkScheduleAuditUncheckedCreateInput, db: Prisma.TransactionClient) {
        return db.workScheduleAudit.create({ data });
    },
};
