import type { Request, Response } from "express";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { publishToQueue } from "../config/rabbitmq.js";
import {User} from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { registerUserSchema } from "../validators/user.js";
import { createAccessToken, createRefreshToken, createSession, hashPassword, hashtoken, verifyRefreshToken } from "../utils/user.js";
import { Session } from "../model/session.js";

export const registerUser = TryCatch(async(req: Request, res: Response) => {
  const { data, error } = registerUserSchema.safeParse(req.body);

  if (error) {
    res.status(400).json({
      message: error.issues[0]?.message ?? "Invalid input",
    });
    return;
  }

  const {name, email, mobileNumber, password} = data;

  const userExist = await User.findOne({email});

  if(userExist){
    res.status(409).json({
      message: "User already exists"
    })
    return;
  }

  const passwordHash = await hashPassword(password);

  const registrationIp: string | undefined = req.ip;

  const user = await User.create({
    name,
    email,
    mobileNumber,
    passwordHash,
    emailVerified: false,
    ...(registrationIp ? { registrationIp } : {}),
  })

  const session = await createSession(user._id.toString(), {
  ...(registrationIp !== undefined && { ip: registrationIp }),
  ...(req.headers["user-agent"] !== undefined && {
    userAgent: req.headers["user-agent"],
  }),
});

  const accessToken = createAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isEmailValid: user.emailVerified,
    sessionId: session.id,
  })

  const refreshToken = createRefreshToken(session.id);

  session.refreshTokenHash = hashtoken(refreshToken);
  await session.save();

  const cookieConfig = {
    httpOnly : true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.cookie("access_token", accessToken, {
    ...cookieConfig,
    maxAge: 15 * 60 * 1000,
    path: "/"
  })

  res.cookie("refresh_token", refreshToken, {
    ...cookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.status(201).json({
    message: "Registration Successfull",

    user: {
      id: user._id.toString,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      emailVerified: user.emailVerified,
    },
  });
});

export const refreshAccessToken = TryCatch(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;

  if(!token){
    res.status(401).json({
      message: "Refresh token is required",
    })
  }

  let decoded: ReturnType<typeof verifyRefreshToken>;

  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    res.status(401).json({
      message: "invalid or expired token",
    })
    return;
  }

  const session = await Session.findById(decoded.sessionId).select("+refreshTokenHash");

  if(
    !session ||
    session.revoked ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.refreshTokenHash
  )  {
    res.status(401).json({
      message: "Session is invalid or expired"
    })
    return;
  }

  if(session.refreshTokenHash !== hashtoken(token)){
    res.status(401).json({
      message: "Refresh token is no longer valid",
    })
  }

  const user = await User.findById(session.userId);

  if(!user){
    res.status(401).json({
      message: "User no longer exists"
    })
    return;
  }

  const newAccessToken = createAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isEmailValid: user.emailVerified,
    sessionId: session.id,
  })

  const newRefreshToken = createRefreshToken(session._id.toString());

  const oldHash = session.refreshTokenHash;
  const newHash = hashtoken(newRefreshToken);

  const result = await Session.updateOne(
    {
      _id: session._id,
      refreshTokenHash: oldHash,
      revoked: false,
      expiresAt : { $gt: new Date() },
    },
    {
      $set: { refreshTokenHash: newHash}
    }
  );

  if(result.modifiedCount !== 1){
    res.status(401).json({
      message : "Refresh token has already been used or revoked"
    });
    return;
  }

  const cookieConfig = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    res.cookie("access_token", newAccessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", newRefreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Tokens refreshed successfully",
    });
});

export const logoutUser = TryCatch(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refresh_token;

    if (!token) {
      res.status(200).json({ message: "Logged out successfully" });
      return;
    }

    try {
      const decoded = verifyRefreshToken(token);

      await Session.updateOne(
        { _id: decoded.sessionId },
        { $set: { revoked: true, refreshTokenHash: null } }
      );
    } catch {
      res.status(400).json({
        message: "Some Error Occurred",
      })
    }

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  }
);

export const loginUser = TryCatch(async(req : Request, res :        Response) => {
    const {email} = req.body;
    const rateLimitKey = `otp:ratelimit:${email}`;
    const rateLimit = await redisClient.get(rateLimitKey);

    if(rateLimit){
      res.status(429).json({
        message: "Too many requests. Please wait before requesting new otp",
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, otp, {
      EX: 300,
    });

    await redisClient.set(rateLimitKey, "true", {
      EX: 60,
    });

    const message = {
      to: email,
      subject: "Your otp code",
      body: `Your otp is ${otp}. It is valid for 5 minutes`,
    };

    await publishToQueue("send-otp", message);

    res.status(200).json({
      message: "OTP sent to your mail",
    });
});

export const verifyUser = TryCatch(async(req, res) => {
  const {email, otp: enteredOtp} = req.body;

  if(!email || !enteredOtp){
    res.status(400).json({
      message: "Email and otp are required",
    });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtp = await redisClient.get(otpKey);

  if(!storedOtp ){
    res.status(400).json({
      message: "otp expired",
    })
    return;
  }
   if(storedOtp !== enteredOtp){
    res.status(400).json({
      message: "Invalid otp: Please enter a valid otp",
    })
    return;
   }

   await redisClient.del(otpKey);

   let user = await User.findOne({ email });

   if(!user){
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
   }

   const token = generateToken(user);

   res.json({
    message:"User verified successfully",
    user,
    token,
   });
});

export const myProfile = TryCatch(async(req:AuthenticatedRequest, res: Response) => {
  const user = req.user;

  res.json(user);
});

export const updateName = TryCatch(async(req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id);

  if(!user){
    res.status(404).json({
      message:"Please Login",
    });
    return;
  }

  user.name = req.body.name;

  await user.save();

  const token = generateToken(user);

  res.json({
    message: "User Updated",
    user,
    token,
  });
});

export const getAllUsers = TryCatch(async(req: AuthenticatedRequest, res) => {
  if(!req.user?._id){
    res.status(401).json({
      message: "Authentication Required"
    })
    return;
  }

  const users = await User.find({ _id: { $ne: req.user._id } });

  res.json(users);
});

export const getAUser = TryCatch(async(req, res) => {
  const user = await User.findById(req.params.id);

  res.json(user);
})
