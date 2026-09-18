import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { saveVoiceBuffer } from "../lib/voiceStorage.js";

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_DATA_URI_PATTERN = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/;
const FILE_DATA_URI_PATTERN = /^data:([^;]+);base64,([A-Za-z0-9+/]+={0,2})$/;
const SUPPORTED_AUDIO_MIME_TYPES = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/m4a", "audio/x-m4a"]);

const isValidBase64 = (value) => {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.length % 4 !== 0) return false;

  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(value);
};

const hasValidImageSignature = (mimeType, buffer) => {
  if (mimeType === "image/png") {
    return (
      buffer.length >= 20 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
      buffer.subarray(-12).equals(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]))
    );
  }

  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 4 &&
      buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) &&
      buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
    );
  }

  if (mimeType === "image/gif") {
    return buffer.length >= 6 && (buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) || buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])));
  }

  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
    buffer.subarray(8, 12).equals(Buffer.from("WEBP")) &&
    buffer.readUInt32LE(4) + 8 === buffer.length
  );
};

export const isValidImageDataUri = (image) => {
  if (typeof image !== "string") return false;

  const match = image.match(IMAGE_DATA_URI_PATTERN);
  if (!match) return false;

  const [, mimeType, encodedImage] = match;
  if (!isValidBase64(encodedImage)) return false;

  const imageBuffer = Buffer.from(encodedImage, "base64");

  if (imageBuffer.length === 0 || imageBuffer.length > MAX_IMAGE_SIZE_BYTES) return false;
  if (imageBuffer.toString("base64") !== encodedImage) return false;

  return hasValidImageSignature(mimeType, imageBuffer);
};

export const isSupportedAudioMimeType = (mimeType) =>
  SUPPORTED_AUDIO_MIME_TYPES.has(String(mimeType || "").split(";")[0].toLowerCase());

export const hasValidAudioSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (mimeType === "audio/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === "audio/ogg") return buffer.subarray(0, 4).equals(Buffer.from("OggS"));
  if (["audio/mp4", "audio/m4a", "audio/x-m4a"].includes(mimeType)) {
    return buffer.length >= 12 && buffer.subarray(4, 8).equals(Buffer.from("ftyp"));
  }
  return false;
};

const isValidFileDataUri = (attachment) => {
  if (!attachment || typeof attachment !== "object") return false;
  if (typeof attachment.data !== "string") return false;
  if (typeof attachment.fileName !== "string" || attachment.fileName.length === 0) return false;
  if (typeof attachment.mimeType !== "string" || attachment.mimeType.length === 0) return false;
  if (typeof attachment.size !== "number" || attachment.size > MAX_ATTACHMENT_SIZE_BYTES) return false;
  const match = attachment.data.match(FILE_DATA_URI_PATTERN);
  if (!match) return false;
  const [, mimeType, encoded] = match;
  return mimeType === attachment.mimeType && isValidBase64(encoded);
};

const uploadBase64Asset = async (dataUri, resourceType = "image") => {
  const result = await cloudinary.uploader.upload(dataUri, { resource_type: resourceType });
  return result.secure_url;
};

const uploadAudioBufferOnce = (buffer) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: "secure-chat/voice" },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    upload.end(buffer);
  });

const uploadAudioBuffer = async (buffer) => {
  const retryDelays = [0, 1000, 2000];
  let lastError;

  for (const delay of retryDelays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await uploadAudioBufferOnce(buffer);
    } catch (error) {
      lastError = error;
      if (![420, 429].includes(error?.http_code)) throw error;
    }
  }

  throw lastError;
};

const isParticipant = (message, userId) =>
  !message.groupId && (
    message.senderId.toString() === userId.toString()
    || message.receiverId?.toString() === userId.toString()
  );

const emitMessageMutation = (message, eventName = "messageUpdated", userIds = [message.senderId, message.receiverId]) => {
  const socketIds = new Set(userIds.flatMap((userId) => getReceiverSocketIds(userId.toString())));
  socketIds.forEach((socketId) => io.to(socketId).emit(eventName, message));
};

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: "page must be at least 1 and limit must be between 1 and 100" });
    }

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ],
        },
        { hiddenFor: { $ne: myId } },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, attachment, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !attachment) {
      return res.status(400).json({ message: "Text or media is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    let attachmentPayload = null;
    let messageType = "text";

    if (image) {
      if (!isValidImageDataUri(image)) {
        return res.status(400).json({ message: "Invalid image upload" });
      }
      imageUrl = await uploadBase64Asset(image, "image");
      messageType = "image";
    }

    if (attachment) {
      if (!isValidFileDataUri(attachment)) {
        return res.status(400).json({ message: "Invalid file upload" });
      }
      const uploadedAttachment = await uploadBase64Asset(attachment.data, "auto");
      attachmentPayload = {
        type: "file",
        url: uploadedAttachment,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
      };
      messageType = "file";
    }

    const receiverSocketIds = getReceiverSocketIds(receiverId.toString());
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text?.trim() || "",
      image: imageUrl,
      messageType,
      attachment: attachmentPayload,
      replyTo: replyTo || null,
      metadata: {},
      messageStatus: "sent",
    });

    await newMessage.save();

    receiverSocketIds.forEach((socketId) => io.to(socketId).emit("newMessage", newMessage));

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendVoiceMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id: receiverId } = req.params;
    const mimeType = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
    const duration = Number(req.headers["x-audio-duration"]);

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: "Voice recording is empty" });
    if (req.body.length > MAX_ATTACHMENT_SIZE_BYTES) return res.status(413).json({ message: "Voice recording exceeds 10 MB" });
    if (!isSupportedAudioMimeType(mimeType)) return res.status(415).json({ message: "Unsupported audio format" });
    if (!hasValidAudioSignature(req.body, mimeType)) return res.status(400).json({ message: "Invalid audio recording" });
    if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) return res.status(400).json({ message: "Invalid audio duration" });
    if (senderId.equals(receiverId)) return res.status(400).json({ message: "Cannot send messages to yourself." });
    if (!(await User.exists({ _id: receiverId }))) return res.status(404).json({ message: "Receiver not found." });

    let audioUrl;
    try {
      audioUrl = await uploadAudioBuffer(req.body);
    } catch (uploadError) {
      console.warn("Cloud voice upload unavailable; using local storage:", uploadError.message);
      const fileName = await saveVoiceBuffer(req.body, mimeType);
      audioUrl = `${req.protocol}://${req.get("host")}/uploads/voice/${fileName}`;
    }
    const receiverSocketIds = getReceiverSocketIds(receiverId.toString());
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: "",
      messageType: "audio",
      attachment: {
        type: "audio",
        url: audioUrl,
        fileName: `voice-message.${mimeType.split("/")[1].replace("x-", "")}`,
        mimeType,
        size: req.body.length,
      },
      metadata: { audioUrl, duration: Math.round(duration) },
      messageStatus: "sent",
    });

    receiverSocketIds.forEach((socketId) => io.to(socketId).emit("newMessage", newMessage));
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendVoiceMessage controller:", error.message);
    res.status(500).json({ message: "Voice message upload failed" });
  }
};

export const markMessagesSeen = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: senderId } = req.params;

    const messages = await Message.find({ senderId, receiverId: myId, messageStatus: { $ne: "seen" } });
    const updatedIds = messages.map((message) => message._id);

    const result = await Message.updateMany({ senderId, receiverId: myId, messageStatus: { $ne: "seen" } }, { messageStatus: "seen" });

    if (result.modifiedCount > 0 && updatedIds.length) {
      const payload = {
        conversationUserId: myId.toString(),
        messageIds: updatedIds.map(String),
        seenAt: new Date().toISOString(),
      };
      getReceiverSocketIds(senderId.toString()).forEach((socketId) => io.to(socketId).emit("messageSeen", payload));
    }

    res.status(200).json({ success: true, messageIds: result.modifiedCount > 0 ? updatedIds : [] });
  } catch (error) {
    console.log("Error in markMessagesSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (typeof emoji !== "string" || !emoji.trim() || emoji.length > 16) {
      return res.status(400).json({ message: "A valid emoji is required" });
    }

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!isParticipant(message, userId)) return res.status(403).json({ message: "Forbidden" });
    if (message.deleted && message.deletedFor === "everyone") {
      return res.status(409).json({ message: "Deleted messages cannot receive reactions" });
    }

    const normalizedEmoji = emoji.trim();
    const existingReaction = message.reactions.find((item) => item.userId.toString() === userId.toString() && item.emoji === normalizedEmoji);
    if (existingReaction) {
      message.reactions = message.reactions.filter((item) => !(item.userId.toString() === userId.toString() && item.emoji === normalizedEmoji));
    } else {
      message.reactions.push({ emoji: normalizedEmoji, userId });
    }

    await message.save();
    emitMessageMutation(message);
    res.status(200).json(message);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.senderId.toString() !== userId.toString()) return res.status(403).json({ message: "Forbidden" });
    if (message.deleted && message.deletedFor === "everyone") {
      return res.status(409).json({ message: "Deleted messages cannot be edited" });
    }
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }
    if (!message.text && (message.image || message.attachment || message.metadata?.audioUrl)) {
      return res.status(409).json({ message: "Attachment-only messages cannot be edited" });
    }

    message.text = text.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    emitMessageMutation(message);
    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { scope = "me" } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!isParticipant(message, userId)) return res.status(403).json({ message: "Forbidden" });
    if (!['me', 'everyone'].includes(scope)) return res.status(400).json({ message: "Invalid delete scope" });

    if (scope === "me") {
      if (!message.hiddenFor.some((id) => id.toString() === userId.toString())) {
        message.hiddenFor.push(userId);
      }
      await message.save();
      emitMessageMutation({ messageId: message._id }, "messageDeletedForMe", [userId]);
      return res.status(200).json({ messageId: message._id, scope: "me" });
    }

    if (message.senderId.toString() !== userId.toString()) return res.status(403).json({ message: "Forbidden" });

    message.deleted = true;
    message.deletedFor = "everyone";
    message.text = "";
    message.image = undefined;
    message.attachment = null;
    message.metadata = {};
    message.reactions = [];
    message.pinned = false;
    message.pinnedAt = null;
    await message.save();

    emitMessageMutation(message);
    res.status(200).json(message);
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!isParticipant(message, userId)) return res.status(403).json({ message: "Forbidden" });
    if (message.deleted && message.deletedFor === "everyone") {
      return res.status(409).json({ message: "Deleted messages cannot be pinned" });
    }

    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : null;
    await message.save();

    emitMessageMutation(message);
    res.status(200).json(message);
  } catch (error) {
    console.log("Error in pinMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString() ? msg.receiverId.toString() : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
