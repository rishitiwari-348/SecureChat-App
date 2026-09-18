import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["member", "moderator", "admin"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mutedUntil: { type: Date, default: null },
  lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  lastReadAt: { type: Date, default: Date.now },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  avatar: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: {
    type: [groupMemberSchema],
    validate: {
      validator: (members) => new Set(members.map(({ userId }) => String(userId))).size === members.length,
      message: "Group members must be unique",
    },
  },
  inviteCodeHash: { type: String, default: null, select: false },
  inviteEnabled: { type: Boolean, default: false },
  inviteExpiresAt: { type: Date, default: null },
  inviteMaxUses: { type: Number, default: null },
  inviteUseCount: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

groupSchema.index({ "members.userId": 1, updatedAt: -1 });
groupSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("Group", groupSchema);
