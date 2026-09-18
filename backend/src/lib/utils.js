import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const getAuthCookieOptions = (nodeEnvironment = ENV.NODE_ENV) => ({
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: nodeEnvironment === "production" ? "none" : "lax",
  secure: nodeEnvironment === "production",
});

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, getAuthCookieOptions());

  return token;
};

// http://localhost
// https://dsmakmk.com
