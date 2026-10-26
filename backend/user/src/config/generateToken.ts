
import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";

configDotenv();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 6) {
  throw new Error(
    "JWT_SECRET must be configured with at least 6 characters"
  );
}

interface TokenUser {
  _id: { toString(): string };
  name: string;
  email: string;
}

export const generateToken = (user: TokenUser): string => {
  return jwt.sign(
    {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "15d",
    }
  );
};
