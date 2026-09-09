import type { Request, Response } from "express";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { publishToQueue } from "../config/rabbitmq.js";
import {User} from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

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

