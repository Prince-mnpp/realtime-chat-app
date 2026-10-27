import argon2 from "argon2";
import { Session } from "../model/session.js";
import dotenv from "dotenv";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {createHash} from "crypto";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if(!JWT_SECRET || JWT_SECRET.length < 6){
  throw new Error("JWT SECRET must be atleast 6 characters long");
}

if(!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET.length < 6){
  throw new Error("refresh_token must be atleast 6 characters long");
}

interface AccessTokenPayload {
  id: string;
  name: string;
  email: string;
  isEmailValid: boolean;
  sessionId: string;
}

export const createAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign({
    user: {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      isEmailValid: payload.isEmailValid,
    },
    sessionId: payload.sessionId,
    tokenType: "access",
  },
  JWT_SECRET,
  {
    algorithm: "HS256",
    expiresIn: "15m"
  }
)
}

export const createRefreshToken = (sessionId: string): string => {
  return jwt.sign({
    sessionId,
    tokenType: "refresh",
  },
  REFRESH_TOKEN_SECRET,
  {
    algorithm: "HS256",
    expiresIn: "7d"
  }
)
}

export const hashPassword = async (password : string) => {
  const hash = await argon2.hash(password);
  return hash;
}

export const comparePassword = async (password : string, hash: string) => {
  return await argon2.verify(hash, password);
};

interface SessionMetadata {
  ip?: string;
  userAgent?: string;
}

export const createSession = async (
  userId: string,
  metadata: SessionMetadata
) => {
  const session = await Session.create({
    userId,
    ...(metadata.ip !== undefined && { ip: metadata.ip }),
    ...(metadata.userAgent !== undefined && {
      userAgent: metadata.userAgent,
    }),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return session;
};

export const hashtoken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
}

export const verifyRefreshToken = (token: string) => {
  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
    algorithms: ["HS256"],
  })

  const payload = decoded as JwtPayload & {
    sessionId?: unknown,
    tokenType?: unknown,
  }

  if(!decoded || !payload.sessionId || payload.sessionId !== "string"){
    throw new Error("invalid refresh token");
  }

  return {
    sessionId: payload.sessionId,
    tokenType: "refresh",
  }
}