import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.SERVER_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "test";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_FROM_NAME = "SecureChat";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.ARCJET_KEY = "test";
process.env.ARCJET_ENV = "development";
process.env.NODE_ENV = "test";

const {
  createEmailVerificationToken,
  buildVerificationUrl,
  hashVerificationToken,
  normalizeEmail,
} = await import("../src/lib/emailVerification.js");
const { login, verifyEmail } = await import("../src/controllers/auth.controller.js");
const { default: User } = await import("../src/models/User.js");

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  redirectURL: undefined,
  cookies: [],
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
  redirect(value) { this.redirectURL = value; return this; },
  cookie(name, value, options) { this.cookies.push({ name, value, options }); return this; },
});

test("normalizes email and creates a hashed, expiring token", () => {
  const first = createEmailVerificationToken();
  const second = createEmailVerificationToken();

  assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.token, first.tokenHash);
  assert.equal(hashVerificationToken(first.token), first.tokenHash);
  assert.ok(first.expiresAt.getTime() > Date.now());
});

test("verification links always target the configured backend route", () => {
  const url = new URL(buildVerificationUrl({}, "token with spaces"));
  assert.equal(url.origin, "http://localhost:3000");
  assert.equal(url.pathname, "/api/auth/verify-email");
  assert.equal(url.searchParams.get("token"), "token with spaces");
});

test("an unverified local account cannot receive a JWT", async () => {
  const originalFindOne = User.findOne;
  const password = await bcrypt.hash("secret123", 10);
  User.findOne = () => ({
    select: async () => ({
      _id: "unverified-user",
      email: "person@example.com",
      fullName: "Person",
      password,
      authProvider: "local",
      isEmailVerified: false,
      emailVerificationTokenHash: "stored-hash",
    }),
  });

  try {
    const response = createResponse();
    await login({ body: { email: "PERSON@example.com", password: "secret123" } }, response);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.message, "Please verify your email before signing in.");
    assert.equal(response.cookies.length, 0);
  } finally {
    User.findOne = originalFindOne;
  }
});

test("verification consumes the token and marks the account verified", async () => {
  const originalFindOne = User.findOne;
  const { token, tokenHash } = createEmailVerificationToken();
  let saved = false;
  const user = {
    email: "person@example.com",
    fullName: "Person",
    isEmailVerified: false,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    async save() { saved = true; },
  };
  User.findOne = (query) => ({
    select: async () => query.emailVerificationTokenHash === tokenHash ? user : null,
  });

  try {
    const response = createResponse();
    await verifyEmail({ query: { token } }, response);
    assert.equal(saved, true);
    assert.equal(user.isEmailVerified, true);
    assert.ok(user.emailVerifiedAt instanceof Date);
    assert.equal(user.emailVerificationTokenHash, undefined);
    assert.equal(user.emailVerificationExpiresAt, undefined);
    assert.match(response.redirectURL, /emailVerification=success/);
  } finally {
    User.findOne = originalFindOne;
  }
});

test("invalid or reused verification tokens are rejected", async () => {
  const originalFindOne = User.findOne;
  User.findOne = () => ({ select: async () => null });

  try {
    const response = createResponse();
    await verifyEmail({ query: { token: "already-used-or-invalid" } }, response);
    assert.match(response.redirectURL, /emailVerification=invalid/);
  } finally {
    User.findOne = originalFindOne;
  }
});
