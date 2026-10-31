import type { NextFunction, Request, Response } from "express";
import { User, type IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { Session } from "../model/session.js";

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

    const token = req.cookies?.access_token;

    if (!token) {
      res.status(401).json({
        message: "Authenticated is required",
      });
      return;
    }

    const decodedValue = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if(typeof decodedValue === "string"){
      res.status(401).json({
        message: "Invalid Token Payload",
      })
      return;
    }

    const payload = decodedValue as JwtPayload & {
      user?: unknown;
      sessionID?: unknown;
      tokenType?: unknown;
    }

    if(
      payload.tokenType !== "access" ||
      typeof payload.sessionID !== "string"
    ){
      res.status(401).json({
        message: "Invalid access token",
      })
      return;
    }

    const session = await Session.findById(payload.sessionID);

    if(
      !session ||
      session.revoked ||
      session.expiresAt.getTime() <= Date.now()
    ){
      res.status(401).json({
        message: "Session expired or revoked"
      })
      return;
    }

    const user = payload.user;

    if (
      !user ||
      typeof user !== "object" ||
      !("_id" in user) ||
      typeof user._id !== "string" ||
      !("email" in user) ||
      typeof user.email !== "string" ||
      !("name" in user) ||
      typeof user.name !== "string"
    ) {
      res.status(401).json({
        message: "Invalid token payload",
      });
      return;
    }

    const currUser = await User.findById(user._id);

    if(!currUser?.emailVerified){
      res.status(403).json({
        message : "Please verify your email first"
      });
      return;
    }

    if(!currUser) {
      res.status(401).json({
        message : "User no longer exists",
      })
      return;
    }

    req.user = currUser;

    next();
  }
  catch(error){
    res.status(401).json({
      message : "Invalid or expired token",
    })
  }
};
