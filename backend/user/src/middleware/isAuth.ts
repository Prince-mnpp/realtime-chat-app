
import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 6) {
  throw new Error(
    "JWT_SECRET must be configured with at least 6 characters"
  );
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({
        message: "Token is missing",
      });
      return;
    }

    const decodedValue = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    const user = decodedValue.user;

    if (
      !user ||
      typeof user !== "object" ||
      typeof user._id !== "string" ||
      typeof user.email !== "string" ||
      typeof user.name !== "string"
    ) {
      res.status(401).json({
        message: "Invalid token payload",
      });
      return;
    }

    req.user = user as IUser;

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
