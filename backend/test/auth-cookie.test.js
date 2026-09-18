import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.RESEND_API_KEY = "test";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_FROM_NAME = "Test";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.ARCJET_KEY = "test";
process.env.ARCJET_ENV = "development";
process.env.NODE_ENV = "test";

const { getAuthCookieOptions } = await import("../src/lib/utils.js");

test("production auth cookies support cross-origin credential requests", () => {
  const options = getAuthCookieOptions("production");
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "none");
});

test("development auth cookies remain localhost-compatible", () => {
  const options = getAuthCookieOptions("development");
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, "lax");
});
