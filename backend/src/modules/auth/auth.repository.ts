import type { Prisma, RefreshToken, User } from "@prisma/client";

import { prisma } from "../../config/prisma";

export type CreateRefreshTokenData = Pick<
    Prisma.RefreshTokenUncheckedCreateInput,
    "userId" | "token" | "expiresAt"
>;

export const authRepository = {
    findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    },

    updateUserPassword(userId: string, passwordHash: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    },

    createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
        return prisma.refreshToken.create({
            data,
        });
    },

    findRefreshToken(token: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findUnique({
            where: { token },
        });
    },

    deleteRefreshToken(token: string): Promise<Prisma.BatchPayload> {
        return prisma.refreshToken.deleteMany({
            where: { token },
        });
    },
};
