import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const calendarExceptionRepository = {
    snapshot<T>(read: (db: Prisma.TransactionClient) => Promise<T>) {
        return prisma.$transaction(read, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    },
    all(scheduleVersionId: string, db: Prisma.TransactionClient) {
        return db.calendarException.findMany({ where: { scheduleVersionId }, orderBy: [{ firstAffectedDate: "asc" }, { id: "asc" }] });
    },
    find(id: string, scheduleVersionId: string, db: Prisma.TransactionClient) {
        return db.calendarException.findFirst({ where: { id, scheduleVersionId } });
    },
    async page(where: Prisma.CalendarExceptionWhereInput, skip: number, take: number, db: Prisma.TransactionClient) {
        const data = await db.calendarException.findMany({ where, skip, take, orderBy: [{ firstAffectedDate: "asc" }, { id: "asc" }] });
        const totalItems = await db.calendarException.count({ where });
        return { data, totalItems };
    },
    create(data: Prisma.CalendarExceptionUncheckedCreateInput, db: Prisma.TransactionClient) {
        return db.calendarException.create({ data });
    },
    replace(id: string, data: Prisma.CalendarExceptionUncheckedUpdateInput, db: Prisma.TransactionClient) {
        return db.calendarException.update({ where: { id }, data });
    },
    remove(id: string, db: Prisma.TransactionClient) {
        return db.calendarException.delete({ where: { id } });
    },
};
