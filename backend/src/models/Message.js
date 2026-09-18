import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "file", "audio"], default: "image" },
    url: { type: String, required: true },
    fileName: { type: String, default: "attachment" },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "system"],
      default: "text",
    },
    messageStatus: {
      type: String,
      enum: ["sent", "seen"],
      default: "sent",
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [reactionSchema],
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: String,
      enum: ["me", "everyone", "none"],
      default: "none",
    },
    hiddenFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

messageSchema.pre("validate", function validateMessageTarget(next) {
  const hasReceiver = Boolean(this.receiverId);
  const hasGroup = Boolean(this.groupId);
  if (hasReceiver === hasGroup) return next(new Error("Message must target exactly one user or group"));
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
