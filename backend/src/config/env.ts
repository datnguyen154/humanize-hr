import "dotenv/config";

const requiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

export const env = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV ?? "development",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",

    databaseUrl: requiredEnv("DATABASE_URL"),
    jwtAccessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    jwtRefreshSecret: requiredEnv("JWT_REFRESH_SECRET"),

    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
};
