
import z from "zod";

export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(100, { message: "Name must not exceed 100 characters" }),

  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .max(100, { message: "Email must not exceed 100 characters" })
    .transform((email) => email.toLowerCase()),

  mobileNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Please enter a valid mobile number",
    }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must not exceed 72 characters" }),

  confirmPassword: z
    .string()
    .min(1, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .max(100, { message: "Email must not exceed 100 characters" })
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, { message: "Password is required" })
    .max(72, { message: "Invalid password" }),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().length(8, {
    message: "Verification token must be 8 characters",
  }),

  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email" })
    .transform((email) => email.toLowerCase()),
});
