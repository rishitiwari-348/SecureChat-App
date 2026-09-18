import { URLSearchParams } from "url";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { generateToken } from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

const getProviderConfig = (provider) => {
  switch (provider) {
    case "google":
      return {
        clientId: ENV.GOOGLE_CLIENT_ID,
        clientSecret: ENV.GOOGLE_CLIENT_SECRET,
        callbackUrl: ENV.GOOGLE_CALLBACK_URL,
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      };
    case "github":
      return {
        clientId: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
        callbackUrl: ENV.GITHUB_CALLBACK_URL,
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userInfoUrl: "https://api.github.com/user",
      };
    default:
      throw new Error("Unsupported OAuth provider");
  }
};

const buildFrontendRedirect = (error = null) => {
  if (!ENV.CLIENT_URL) {
    throw new Error("CLIENT_URL is not configured");
  }

  const url = new URL(error ? "/login" : "/", ENV.CLIENT_URL);
  if (error) {
    url.searchParams.set("error", error);
  }

  return url.toString();
};

const normalizeName = (providerProfile, provider) => {
  if (provider === "google") {
    return providerProfile.name || providerProfile.given_name || "Google User";
  }

  return providerProfile.name || providerProfile.login || "GitHub User";
};

const getGithubEmail = async (accessToken) => {
  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "secure-chat",
    },
  });

  if (!emailResponse.ok) {
    console.error(`OAuth verified-email fetch failed for github with status ${emailResponse.status}`);
    return null;
  }

  const emails = await emailResponse.json();
  return emails.find((entry) => entry.primary && entry.verified)?.email
    || emails.find((entry) => entry.verified)?.email
    || null;
};

class OAuthFlowError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const redirectWithOAuthError = (res, errorCode) => {
  const redirectUrl = buildFrontendRedirect(errorCode);
  console.log("OAuth redirect destination:", redirectUrl);
  return res.redirect(redirectUrl);
};

export const getOAuthProviderId = (profile) => String(profile.id ?? profile.sub);

const createOrUpdateOAuthUser = async ({ provider, profile }) => {
  const email = profile.email?.toLowerCase();
  const providerId = getOAuthProviderId(profile);
  const providerVerifiedEmail = Boolean(email && profile.emailVerified);

  if (!providerVerifiedEmail) {
    throw new OAuthFlowError("oauth_email_unverified");
  }

  let user = await User.findOne({ authProvider: provider, providerId });

  if (!user && providerVerifiedEmail) {
    user = await User.findOne({ email });
  }

  if (!user) {
    const newUser = new User({
      fullName: normalizeName(profile, provider),
      email: email || `${provider}-${providerId}@oauth.local`,
      password: undefined,
      profilePic: profile.avatarUrl || profile.picture || "",
      authProvider: provider,
      providerId,
      isEmailVerified: providerVerifiedEmail,
      emailVerifiedAt: providerVerifiedEmail ? new Date() : undefined,
    });

    const savedUser = await newUser.save();

    try {
      await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
    } catch (error) {
      console.error(`Welcome email delivery failed for ${provider} OAuth user`);
    }

    return savedUser;
  }

  const update = {
    authProvider: provider,
    providerId,
  };

  if (providerVerifiedEmail) {
    update.isEmailVerified = true;
    update.emailVerifiedAt = user.emailVerifiedAt || new Date();
    update.emailVerificationTokenHash = undefined;
    update.emailVerificationExpiresAt = undefined;
  }

  if (!user.fullName || user.fullName === "Google User" || user.fullName === "GitHub User") {
    update.fullName = normalizeName(profile, provider);
  }

  if (!user.profilePic && (profile.avatarUrl || profile.picture)) {
    update.profilePic = profile.avatarUrl || profile.picture;
  }

  if (email && !user.email) {
    update.email = email;
  }

  const updateOperation = providerVerifiedEmail
    ? {
        $set: update,
        $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 },
      }
    : update;

  return User.findByIdAndUpdate(user._id, updateOperation, { new: true });
};

const issueSession = (user, res) => {
  if (!user.isEmailVerified) {
    throw new Error("OAuth provider did not confirm a verified email");
  }
  generateToken(user._id, res);
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
  };
};

export const startOAuthFlow = (provider) => async (req, res) => {
  try {
    const config = getProviderConfig(provider);
    if (!config.clientId || !config.clientSecret || !config.callbackUrl) {
      return redirectWithOAuthError(res, "oauth_not_configured");
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope: provider === "google" ? "openid email profile" : "read:user user:email",
    });

    if (provider === "google") {
      params.set("prompt", "select_account");
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;
    return res.redirect(authUrl);
  } catch {
    console.error(`OAuth start failed for ${provider}`);
    return redirectWithOAuthError(res, "oauth_failed");
  }
};

export const handleOAuthCallback = (provider) => async (req, res) => {
  console.log(`OAuth callback reached for ${provider}`);

  try {
    const config = getProviderConfig(provider);
    if (!config.clientId || !config.clientSecret || !config.callbackUrl) {
      return redirectWithOAuthError(res, "oauth_not_configured");
    }

    if (req.query.error) {
      console.warn(`OAuth authorization was denied for ${provider}`);
      return redirectWithOAuthError(res, "oauth_denied");
    }

    const code = req.query.code;
    if (!code) return redirectWithOAuthError(res, "oauth_denied");

    let tokenResponse;
    if (provider === "google") {
      tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl,
          grant_type: "authorization_code",
        }),
      });
    } else {
      tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl,
        }),
      });
    }

    if (!tokenResponse.ok) {
      console.error(`OAuth token exchange failed for ${provider} with status ${tokenResponse.status}`);
      throw new OAuthFlowError("oauth_token_failed");
    }

    const tokenPayload = await tokenResponse.json();
    const accessToken = tokenPayload.access_token;
    if (!accessToken) {
      throw new OAuthFlowError("oauth_token_failed");
    }

    let profile;
    if (provider === "google") {
      const userResponse = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        console.error(`OAuth profile fetch failed for google with status ${userResponse.status}`);
        throw new OAuthFlowError("oauth_profile_failed");
      }

      const googleProfile = await userResponse.json();
      profile = {
        ...googleProfile,
        emailVerified: googleProfile.email_verified === true,
      };
    } else {
      const userResponse = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "secure-chat",
        },
      });

      if (!userResponse.ok) {
        console.error(`OAuth profile fetch failed for github with status ${userResponse.status}`);
        throw new OAuthFlowError("oauth_profile_failed");
      }

      const githubProfile = await userResponse.json();
      const email = await getGithubEmail(accessToken);
      profile = {
        id: githubProfile.id,
        email,
        name: githubProfile.name || githubProfile.login,
        login: githubProfile.login,
        avatarUrl: githubProfile.avatar_url,
        emailVerified: Boolean(email),
      };
    }

    const user = await createOrUpdateOAuthUser({ provider, profile });
    issueSession(user, res);

    const redirectUrl = buildFrontendRedirect();
    console.log("OAuth redirect destination:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    const errorCode = error instanceof OAuthFlowError ? error.code : "oauth_failed";
    console.error(`OAuth callback failed for ${provider}: ${errorCode}`);
    return redirectWithOAuthError(res, errorCode);
  }
};
