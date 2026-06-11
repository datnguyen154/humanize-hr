import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { UserStatus, type Role, type User } from "@prisma/client";

import { env } from "../../config/env";
import { authRepository } from "./auth.repository";

type AuthUser = Pick<User, "id" | "email" | "fullName" | "role">;

type TokenPayload = {
  userId: string;
  role: Role;
};

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type RefreshAccessTokenResult = {
  accessToken: string;
};

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

const getJwtSecret = (secret: string | undefined, name: string): string => {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  return secret;
};

const parseExpiresInToMilliseconds = (value: string): number => {
  const match = value.trim().match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid token expiration value: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const createToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string =>
  jwt.sign(payload, secret, {
    expiresIn,
  });

const decodeRefreshToken = (refreshToken: string): TokenPayload => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      getJwtSecret(env.jwtRefreshSecret, "JWT_REFRESH_SECRET"),
    );

    if (
      typeof decoded === "string" ||
      !isTokenPayload(decoded)
    ) {
      throw new AuthServiceError("Unauthorized", 401);
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("Unauthorized", 401);
  }
};

const isTokenPayload = (payload: JwtPayload): payload is JwtPayload & TokenPayload =>
  typeof payload.userId === "string" &&
  (payload.role === "ADMIN" || payload.role === "EMPLOYEE");

const createAccessToken = (user: AuthUser): string =>
  createToken(
    {
      userId: user.id,
      role: user.role,
    },
    getJwtSecret(env.jwtAccessSecret, "JWT_ACCESS_SECRET"),
    env.accessTokenExpiresIn as SignOptions["expiresIn"],
  );

const createRefreshToken = (user: AuthUser): string =>
  createToken(
    {
      userId: user.id,
      role: user.role,
    },
    getJwtSecret(env.jwtRefreshSecret, "JWT_REFRESH_SECRET"),
    env.refreshTokenExpiresIn as SignOptions["expiresIn"],
  );

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new AuthServiceError("Invalid email or password", 401);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthServiceError("Account is inactive", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthServiceError("Invalid email or password", 401);
    }

    const authUser = toAuthUser(user);
    const accessToken = createAccessToken(authUser);
    const refreshToken = createRefreshToken(authUser);
    const expiresAt = new Date(
      Date.now() + parseExpiresInToMilliseconds(env.refreshTokenExpiresIn),
    );

    await authRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  },

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AuthServiceError("Unauthorized", 401);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthServiceError("Account is inactive", 403);
    }

    return toAuthUser(user);
  },

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<RefreshAccessTokenResult> {
    const payload = decodeRefreshToken(refreshToken);
    const storedRefreshToken =
      await authRepository.findRefreshToken(refreshToken);

    if (!storedRefreshToken) {
      throw new AuthServiceError("Unauthorized", 401);
    }

    if (storedRefreshToken.expiresAt.getTime() <= Date.now()) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AuthServiceError("Token expired", 401);
    }

    const user = await authRepository.findUserById(payload.userId);

    if (!user) {
      throw new AuthServiceError("Unauthorized", 401);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthServiceError("Account is inactive", 403);
    }

    return {
      accessToken: createAccessToken(toAuthUser(user)),
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await authRepository.deleteRefreshToken(refreshToken);
  },
};
