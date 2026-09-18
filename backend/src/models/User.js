import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      default: undefined,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: undefined,
      select: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: undefined,
    },
    profilePic: {
      type: String,
      default: "",
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    presenceStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
