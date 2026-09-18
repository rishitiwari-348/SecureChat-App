import { sendVerificationEmail } from "../emails/emailHandlers.js";
import { generateToken, getAuthCookieOptions } from "../lib/utils.js";
import { buildVerificationUrl, createEmailVerificationToken, hashVerificationToken, normalizeEmail } from "../lib/emailVerification.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = fullName.trim();

    if (!normalizedName) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // 123456 => $dnjasdkasj_?dmsakmk
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verification = createEmailVerificationToken();
    const newUser = new User({
      fullName: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
      isEmailVerified: false,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
    });

    if (newUser) {
      const savedUser = await newUser.save();

      try {
        await sendVerificationEmail(
          savedUser.email,
          savedUser.fullName,
          buildVerificationUrl(req, verification.token)
        );
      } catch (error) {
        return res.status(503).json({
          message: "Account created, but the verification email could not be sent. Please request a new verification email.",
        });
      }

      return res.status(201).json({
        message: "Account created. Please verify your email before signing in.",
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller");
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email) }).select("+emailVerificationTokenHash");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    if (!user.password) {
      return res.status(400).json({ message: "Please use the social sign-in option for this account" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Records created before email verification was introduced do not contain this field.
    if (user.isEmailVerified === false && user.emailVerificationTokenHash) {
      return res.status(403).json({ message: "Please verify your email before signing in." });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verificationRedirect = (status) => {
  if (!ENV.CLIENT_URL) {
    throw new Error("CLIENT_URL is not configured");
  }

  const url = new URL("/login", ENV.CLIENT_URL);
  url.searchParams.set("emailVerification", status);
  return url.toString();
};

export const verifyEmail = async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.redirect(verificationRedirect("invalid"));

  try {
    const user = await User.findOne({
      emailVerificationTokenHash: hashVerificationToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
      isEmailVerified: false,
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (!user) {
      return res.redirect(verificationRedirect("invalid"));
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return res.redirect(verificationRedirect("success"));
  } catch {
    return res.redirect(verificationRedirect("invalid"));
  }
};

const GENERIC_RESEND_MESSAGE = "If an unverified account exists for that email, a verification link has been sent.";

export const resendVerification = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(200).json({ message: GENERIC_RESEND_MESSAGE });

  try {
    const user = await User.findOne({
      email,
      authProvider: "local",
      isEmailVerified: false,
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (user) {
      const verification = createEmailVerificationToken();
      user.emailVerificationTokenHash = verification.tokenHash;
      user.emailVerificationExpiresAt = verification.expiresAt;
      await user.save();

      try {
        await sendVerificationEmail(user.email, user.fullName, buildVerificationUrl(req, verification.token));
      } catch {
        // Keep the public response generic and never disclose delivery or account state.
      }
    }

    return res.status(200).json({ message: GENERIC_RESEND_MESSAGE });
  } catch {
    return res.status(200).json({ message: GENERIC_RESEND_MESSAGE });
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { ...getAuthCookieOptions(), maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
