import crypto from "crypto";
import { ENV } from "./env.js";

export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;

export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
};

export const buildVerificationUrl = (_request, token) => {
  if (!ENV.SERVER_URL) {
    throw new Error("SERVER_URL is not configured");
  }

  const url = new URL("/api/auth/verify-email", ENV.SERVER_URL);
  url.searchParams.set("token", token);
  return url.toString();
};
