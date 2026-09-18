import { normalizeEmail } from "../lib/emailVerification.js";

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export const verificationResendRateLimit = (req, res, next) => {
  const now = Date.now();
  const email = normalizeEmail(req.body?.email);
  const key = `${req.ip}:${email}`;
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_ATTEMPTS) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }

  current.count += 1;
  return next();
};
