import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.SERVER_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "test";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_FROM_NAME = "Test";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.ARCJET_KEY = "test";
process.env.ARCJET_ENV = "development";
process.env.NODE_ENV = "test";
process.env.GOOGLE_CLIENT_ID = "google-test-id";
process.env.GOOGLE_CLIENT_SECRET = "google-test-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/api/auth/oauth/google/callback";
process.env.GITHUB_CLIENT_ID = "github-test-id";
process.env.GITHUB_CLIENT_SECRET = "github-test-secret";
process.env.GITHUB_CALLBACK_URL = "http://localhost:3000/api/auth/oauth/github/callback";

const { getOAuthProviderId, startOAuthFlow, handleOAuthCallback } = await import("../src/controllers/oauth.controller.js");
const { getAllContacts } = await import("../src/controllers/message.controller.js");
const { default: User } = await import("../src/models/User.js");

test("uses Google's sub claim as the stable provider ID", () => {
  assert.equal(getOAuthProviderId({ sub: "google-user-123" }), "google-user-123");
});

test("keeps using GitHub's id as the stable provider ID", () => {
  assert.equal(getOAuthProviderId({ id: 456 }), "456");
});

test("Google starts with the exact configured callback and no empty parameters", async () => {
  let redirectURL;
  await startOAuthFlow("google")({}, { redirect(value) { redirectURL = value; } });
  const url = new URL(redirectURL);
  assert.equal(url.searchParams.get("redirect_uri"), process.env.GOOGLE_CALLBACK_URL);
  assert.equal(url.searchParams.get("prompt"), "select_account");
  assert.equal([...url.searchParams.entries()].some(([, value]) => value === ""), false);
});

test("cancelled OAuth redirects to a controlled frontend error", async () => {
  let redirectURL;
  await handleOAuthCallback("github")(
    { query: { error: "access_denied", error_description: "provider detail must not leak" } },
    { redirect(value) { redirectURL = value; } }
  );
  const url = new URL(redirectURL);
  assert.equal(url.origin, "http://localhost:5173");
  assert.equal(url.pathname, "/login");
  assert.equal(url.searchParams.get("error"), "oauth_denied");
  assert.equal(redirectURL.includes("provider detail"), false);
});

test("contacts include every provider, exclude the current user, and remain stable on refresh", async () => {
  const users = [
    { _id: "current", fullName: "Current User", authProvider: "local", profilePic: "" },
    { _id: "local", fullName: "Local User", authProvider: "local", profilePic: "" },
    { _id: "google", fullName: "Google User", authProvider: "google", profilePic: null },
    { _id: "github", fullName: "GitHub User", authProvider: "github", profilePic: "avatar" },
    { _id: "existing", fullName: "Existing Contact", authProvider: "local", profilePic: "avatar" },
  ];
  const originalFind = User.find;
  User.find = ({ _id: { $ne } }) => ({
    select: async () => users.filter((user) => user._id !== String($ne)),
  });

  const request = { user: { _id: "current" } };
  const loadContacts = async () => {
    let body;
    const response = {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(value) {
        body = value;
      },
    };
    await getAllContacts(request, response);
    return body;
  };

  try {
    const firstLoad = await loadContacts();
    const refreshedLoad = await loadContacts();
    assert.deepEqual(firstLoad.map((user) => user._id), ["local", "google", "github", "existing"]);
    assert.deepEqual(refreshedLoad, firstLoad);
  } finally {
    User.find = originalFind;
  }
});
