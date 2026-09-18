import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { isValidImageDataUri } from "./message.controller.js";

const MAX_GROUP_MEMBERS = 100;
const groupRoom = (groupId) => `group:${groupId}`;
const populateGroup = (query) => query.populate("createdBy", "fullName profilePic").populate("members.userId", "fullName profilePic presenceStatus");

const joinMemberSockets = (group) => {
  group.members.forEach(({ userId }) => {
    getReceiverSocketIds(String(userId)).forEach((socketId) => io.sockets.sockets.get(socketId)?.join(groupRoom(group._id)));
  });
};

export const createGroup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const requestedIds = Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [];
    const creatorId = String(req.user._id);
    const memberIds = [...new Set(requestedIds.filter((id) => id !== creatorId))];

    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: "Group name must be between 2 and 80 characters" });
    if (description.length > 500) return res.status(400).json({ message: "Group description is too long" });
    if (memberIds.length < 2) return res.status(400).json({ message: "Select at least two other members" });
    if (memberIds.length + 1 > MAX_GROUP_MEMBERS || memberIds.some((id) => !mongoose.isObjectIdOrHexString(id))) {
      return res.status(400).json({ message: "Invalid group members" });
    }

    const validUsers = await User.find({ _id: { $in: memberIds } }).select("_id");
    if (validUsers.length !== memberIds.length) return res.status(400).json({ message: "One or more selected members are invalid" });

    let avatar = "";
    if (req.body.avatar) {
      if (!isValidImageDataUri(req.body.avatar)) return res.status(400).json({ message: "Invalid group avatar" });
      avatar = (await cloudinary.uploader.upload(req.body.avatar, { resource_type: "image", folder: "secure-chat/groups" })).secure_url;
    }

    const group = await Group.create({
      name,
      description,
      avatar,
      createdBy: req.user._id,
      members: [
        { userId: req.user._id, role: "admin", addedBy: req.user._id },
        ...validUsers.map(({ _id }) => ({ userId: _id, role: "member", addedBy: req.user._id })),
      ],
    });
    joinMemberSockets(group);
    const populated = await populateGroup(Group.findById(group._id));
    group.members.forEach(({ userId }) => getReceiverSocketIds(String(userId)).forEach((socketId) => io.to(socketId).emit("group:created", populated)));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error?.message || "Unable to create group" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await populateGroup(Group.find({ "members.userId": req.user._id, deletedAt: null }).sort({ updatedAt: -1 }));
    res.json(groups);
  } catch {
    res.status(500).json({ message: "Unable to load groups" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.group._id, hiddenFor: { $ne: req.user._id } }).sort({ createdAt: 1 }).populate("senderId", "fullName profilePic");
    res.json(messages);
  } catch {
    res.status(500).json({ message: "Unable to load group messages" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    let image = "";
    if (req.body.image) {
      if (!isValidImageDataUri(req.body.image)) return res.status(400).json({ message: "Invalid image" });
      image = (await cloudinary.uploader.upload(req.body.image, { resource_type: "image" })).secure_url;
    }
    if (!text && !image) return res.status(400).json({ message: "Message content is required" });

    const message = await Message.create({
      senderId: req.user._id,
      groupId: req.group._id,
      text,
      image,
      messageType: image ? "image" : "text",
    });
    const populated = await message.populate("senderId", "fullName profilePic");
    req.group.updatedAt = new Date();
    await req.group.save();
    io.to(groupRoom(req.group._id)).emit("group:message", populated);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error?.message || "Unable to send group message" });
  }
};
