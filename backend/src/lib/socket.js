import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Group from "../models/Group.js";

const app = express();
const server = http.createServer(app);

const developmentSocketOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedSocketOrigins = [
  ENV.CLIENT_URL,
  ...(ENV.NODE_ENV === "production" ? [] : developmentSocketOrigins),
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
      } else if (allowedSocketOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId) {
  return userSocketMap.get(userId)?.values().next().value;
}

export function getReceiverSocketIds(userId) {
  return Array.from(userSocketMap.get(userId) ?? []);
}

const userSocketMap = new Map();
const activeCalls = new Map();
const userActiveCall = new Map();
const callTimeouts = new Map();
const activeVoiceRecordings = new Map();
const pendingVoiceRecordingStarts = new Map();

const emitToUserSockets = (userId, eventName, payload) => {
  const socketIds = getReceiverSocketIds(userId);
  socketIds.forEach((socketId) => io.to(socketId).emit(eventName, payload));
};

const broadcastPresence = async (userId) => {
  const onlineUserIds = Array.from(userSocketMap.keys());
  io.emit("getOnlineUsers", onlineUserIds);

  const user = await User.findById(userId).select("_id fullName presenceStatus lastSeenAt");
  if (user) {
    io.emit("presenceUpdated", { userId, presenceStatus: "online", lastSeenAt: user.lastSeenAt });
  }
};

const markUserOffline = async (userId) => {
  const now = new Date();
  await User.findByIdAndUpdate(userId, { presenceStatus: "offline", lastSeenAt: now }, { new: true });
  io.emit("presenceUpdated", { userId, presenceStatus: "offline", lastSeenAt: now });
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
};

const releaseCall = (callId) => {
  const call = activeCalls.get(callId);
  if (!call) return null;
  clearTimeout(callTimeouts.get(callId));
  callTimeouts.delete(callId);
  activeCalls.delete(callId);
  if (userActiveCall.get(call.callerId) === callId) userActiveCall.delete(call.callerId);
  if (userActiveCall.get(call.receiverId) === callId) userActiveCall.delete(call.receiverId);
  return call;
};

const debugCall = (event, details = {}) => {
  if (ENV.NODE_ENV !== "production") console.debug(`[call] ${event}`, details);
};

const terminateCall = (callId, endedBy, reason = "ended") => {
  const call = activeCalls.get(callId);
  if (!call || (endedBy !== "server" && ![call.callerId, call.receiverId].includes(endedBy))) return null;

  debugCall("call:end received", {
    callId,
    endedBy,
    reason,
    activeCallsBefore: activeCalls.size,
    busyUsersBefore: userActiveCall.size,
  });
  releaseCall(callId);
  const payload = {
    callId,
    callerId: call.callerId,
    receiverId: call.receiverId,
    callType: call.callType,
    endedAt: Date.now(),
    endedBy,
    reason,
  };
  emitToUserSockets(call.callerId, "call:ended", payload);
  emitToUserSockets(call.receiverId, "call:ended", payload);
  debugCall("call marked ended and emitted", {
    callId,
    activeCallsAfter: activeCalls.size,
    busyUsersAfter: userActiveCall.size,
    callerSockets: getReceiverSocketIds(call.callerId).length,
    receiverSockets: getReceiverSocketIds(call.receiverId).length,
  });
  return call;
};

const relayCallEvent = (socket, eventName, outgoingEventName) => {
  socket.on(eventName, (payload = {}) => {
    const call = activeCalls.get(payload.callId);
    if (!call || ![call.callerId, call.receiverId].includes(socket.userId)) return;
    const targetId = socket.userId === call.callerId ? call.receiverId : call.callerId;
    emitToUserSockets(targetId, outgoingEventName, {
      ...payload,
      callId: call.callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      callType: call.callType,
      senderId: socket.userId,
    });
  });
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  const userSockets = userSocketMap.get(userId) ?? new Set();
  userSockets.add(socket.id);
  userSocketMap.set(userId, userSockets);

  User.findByIdAndUpdate(userId, { presenceStatus: "online", lastSeenAt: null }, { new: true }).catch(() => {});
  Group.find({ "members.userId": userId, deletedAt: null }).select("_id").lean()
    .then((groups) => groups.forEach(({ _id }) => socket.join(`group:${_id}`)))
    .catch(() => {});
  broadcastPresence(userId);

  socket.on("typing", ({ receiverId, senderId, isTyping }) => {
    emitToUserSockets(receiverId, "typing", { senderId, isTyping });
  });

  socket.on("voice:recording:start", async ({ receiverId } = {}) => {
    if (!mongoose.isValidObjectId(receiverId) || receiverId === userId) return;

    const currentRecording = activeVoiceRecordings.get(socket.id);
    if (currentRecording && currentRecording.receiverId !== receiverId) {
      emitToUserSockets(currentRecording.receiverId, "voice:recording:stop", {
        senderId: userId,
        receiverId: currentRecording.receiverId,
        activityId: socket.id,
        timestamp: Date.now(),
      });
      activeVoiceRecordings.delete(socket.id);
    }

    if (!activeVoiceRecordings.has(socket.id)) {
      const startToken = Symbol("voice-recording-start");
      pendingVoiceRecordingStarts.set(socket.id, startToken);
      const receiverExists = await User.exists({ _id: receiverId });
      if (pendingVoiceRecordingStarts.get(socket.id) !== startToken) return;
      pendingVoiceRecordingStarts.delete(socket.id);
      if (!receiverExists || !socket.connected) return;
    }

    activeVoiceRecordings.set(socket.id, { receiverId });
    emitToUserSockets(receiverId, "voice:recording:start", {
      senderId: userId,
      receiverId,
      activityId: socket.id,
      timestamp: Date.now(),
    });
  });

  socket.on("voice:recording:stop", () => {
    pendingVoiceRecordingStarts.delete(socket.id);
    const recording = activeVoiceRecordings.get(socket.id);
    if (!recording) return;
    activeVoiceRecordings.delete(socket.id);
    emitToUserSockets(recording.receiverId, "voice:recording:stop", {
      senderId: userId,
      receiverId: recording.receiverId,
      activityId: socket.id,
      timestamp: Date.now(),
    });
  });

  socket.on("call:start", ({ callId, receiverId, callType }) => {
    if (!callId || !receiverId || !["voice", "video"].includes(callType)) return;
    const basePayload = { callId, callerId: userId, receiverId, callType };
    if (receiverId === userId || activeCalls.has(callId)) {
      return socket.emit("call:busy", basePayload);
    }
    if (!userSocketMap.has(receiverId)) {
      return socket.emit("call:unavailable", basePayload);
    }
    if (userActiveCall.has(userId) || userActiveCall.has(receiverId)) {
      return socket.emit("call:busy", basePayload);
    }

    const call = { ...basePayload, callerName: socket.user.fullName, connectedAt: null, status: "ringing", startedBySocket: socket.id };
    callTimeouts.set(callId, setTimeout(() => terminateCall(callId, "server", "missed"), 30_000));
    activeCalls.set(callId, call);
    userActiveCall.set(userId, callId);
    userActiveCall.set(receiverId, callId);
    emitToUserSockets(receiverId, "call:incoming", call);
  });

  socket.on("call:accept", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.receiverId !== userId || call.acceptedBySocket) return;
    call.acceptedBySocket = socket.id;
    call.status = "connecting";
    clearTimeout(callTimeouts.get(callId));
    callTimeouts.delete(callId);
    emitToUserSockets(call.callerId, "call:accepted", { ...call, senderId: userId });
    getReceiverSocketIds(userId)
      .filter((socketId) => socketId !== socket.id)
      .forEach((socketId) => io.to(socketId).emit("call:taken", { ...call }));
  });
  relayCallEvent(socket, "webrtc:offer", "webrtc:offer");
  relayCallEvent(socket, "webrtc:answer", "webrtc:answer");
  relayCallEvent(socket, "webrtc:ice-candidate", "webrtc:ice-candidate");

  socket.on("call:connected", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || ![call.callerId, call.receiverId].includes(userId)) return;
    if (!call.connectedAt) call.connectedAt = Date.now();
    call.status = "connected";
    const payload = { ...call, connectedAt: call.connectedAt };
    emitToUserSockets(call.callerId, "call:connected", payload);
    emitToUserSockets(call.receiverId, "call:connected", payload);
  });

  socket.on("call:reject", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.receiverId !== userId) return;
    emitToUserSockets(call.callerId, "call:rejected", { ...call, senderId: userId });
    terminateCall(callId, userId, "rejected");
  });

  socket.on("call:end", ({ callId, reason = "ended" }) => {
    terminateCall(callId, userId, typeof reason === "string" ? reason : "ended");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    pendingVoiceRecordingStarts.delete(socket.id);
    const recording = activeVoiceRecordings.get(socket.id);
    if (recording) {
      activeVoiceRecordings.delete(socket.id);
      emitToUserSockets(recording.receiverId, "voice:recording:stop", {
        senderId: userId,
        receiverId: recording.receiverId,
        activityId: socket.id,
        timestamp: Date.now(),
      });
    }
    const sockets = userSocketMap.get(userId);
    sockets?.delete(socket.id);

    if (sockets?.size === 0) {
      userSocketMap.delete(userId);
    }

    const callId = userActiveCall.get(userId);
    const call = callId ? activeCalls.get(callId) : null;
    if (call && [call.startedBySocket, call.acceptedBySocket].includes(socket.id)) {
      terminateCall(callId, userId, "disconnected");
    }

    if (sockets?.size === 0) {
      markUserOffline(userId);
    } else {
      io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    }
  });
});

export { io, app, server };
