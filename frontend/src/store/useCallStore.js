import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

let peerConnection = null;
let pendingIceCandidates = [];
let callTimer = null;
let noAnswerTimer = null;
let disconnectTimer = null;
let connectedLocally = false;
let connectedEventSent = false;
let endEventSent = false;
let screenStream = null;

const debugCall = (event, details = {}) => {
  if (import.meta.env.DEV) console.debug(`[call] ${event}`, details);
};

const getIceServers = () => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL?.trim();
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME?.trim() || "",
      credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
    });
  }
  return iceServers;
};

const clearCallTimers = () => {
  if (callTimer) clearInterval(callTimer);
  if (noAnswerTimer) clearTimeout(noAnswerTimer);
  if (disconnectTimer) clearTimeout(disconnectTimer);
  callTimer = null;
  noAnswerTimer = null;
  disconnectTimer = null;
};

const getMediaErrorMessage = (error, callType) => {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return `Please allow ${callType === "video" ? "camera and microphone" : "microphone"} access to make this call.`;
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return `No ${callType === "video" ? "camera or microphone" : "microphone"} was found.`;
  }
  return "Unable to access your media devices.";
};

const stopStream = (stream) => stream?.getTracks().forEach((track) => track.stop());

export const useCallStore = create((set, get) => ({
  callId: null,
  callType: null,
  direction: null,
  status: "idle",
  caller: null,
  receiver: null,
  activeCall: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  connectedAt: null,
  endedAt: null,
  error: null,
  callDuration: 0,
  isMuted: false,
  isCameraOff: false,
  isSpeakerOff: false,
  isScreenSharing: false,
  isFullscreen: false,
  listenersSocket: null,

  startTimer: () => {
    clearCallTimers();
    const updateDuration = () => {
      const connectedAt = get().connectedAt;
      if (connectedAt) set({ callDuration: Math.max(0, Math.floor((Date.now() - connectedAt) / 1000)) });
    };
    updateDuration();
    callTimer = setInterval(updateDuration, 1000);
  },

  applyPendingIceCandidates: async () => {
    if (!peerConnection?.remoteDescription) return;
    const candidates = pendingIceCandidates;
    pendingIceCandidates = [];
    for (const candidate of candidates) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        debugCall("queued ICE candidate failed", { callId: get().callId });
      }
    }
  },

  createPeerConnection: (targetId) => {
    if (peerConnection) return peerConnection;
    const socket = useAuthStore.getState().socket;
    const callId = get().callId;
    peerConnection = new RTCPeerConnection({ iceServers: getIceServers() });

    peerConnection.onicecandidate = ({ candidate }) => {
      if (!candidate || !socket || callId !== get().callId) return;
      socket.emit("webrtc:ice-candidate", { callId, candidate, receiverId: targetId });
      debugCall("ICE candidate sent", { callId });
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && callId === get().callId) {
        set({ remoteStream });
        debugCall("remote track received", { callId, kind: event.track.kind });
      }
    };

    const handleConnectionState = () => {
      const connectionState = peerConnection?.connectionState;
      const iceConnectionState = peerConnection?.iceConnectionState;
      debugCall("connection state", { callId, connectionState, iceConnectionState });
      const isConnected = connectionState === "connected"
        || ["connected", "completed"].includes(iceConnectionState);

      if (isConnected) {
        if (disconnectTimer) clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }

      if (isConnected && !connectedLocally) {
        connectedLocally = true;
        set({ status: "connected", error: null });
        if (!connectedEventSent) {
          connectedEventSent = true;
          socket?.emit("call:connected", { callId });
        }
        if (get().connectedAt) get().startTimer();
      } else if (connectionState === "disconnected" || iceConnectionState === "disconnected") {
        if (!disconnectTimer) {
          disconnectTimer = setTimeout(() => {
            if (peerConnection?.connectionState === "disconnected" || peerConnection?.iceConnectionState === "disconnected") {
              get().failCall("The call connection was lost.");
            }
          }, 10_000);
        }
      } else if (["failed", "closed"].includes(connectionState) || iceConnectionState === "failed") {
        get().failCall("The call connection failed.");
      }
    };

    peerConnection.onconnectionstatechange = handleConnectionState;
    peerConnection.oniceconnectionstatechange = handleConnectionState;
    return peerConnection;
  },

  setupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || get().listenersSocket === socket) return;
    get().teardownSocketListeners();

    const onIncoming = (call) => {
      if (get().status !== "idle") {
        socket.emit("call:reject", { callId: call.callId, reason: "busy" });
        return;
      }
      debugCall("call:incoming", { callId: call.callId, callType: call.callType });
      const incomingCall = { ...call, isVideo: call.callType === "video", status: "ringing" };
      set({
        callId: call.callId,
        callType: call.callType,
        direction: "incoming",
        status: "ringing",
        caller: { _id: call.callerId, fullName: call.callerName },
        receiver: { _id: call.receiverId },
        incomingCall,
        activeCall: null,
        error: null,
      });
    };

    const onOffer = ({ callId, offer }) => {
      if (callId !== get().callId) return;
      set((state) => ({ incomingCall: state.incomingCall ? { ...state.incomingCall, offer } : state.incomingCall }));
      debugCall("offer received", { callId });
    };

    const onAccepted = ({ callId }) => {
      if (callId !== get().callId || get().direction !== "outgoing") return;
      set({ status: "connecting", activeCall: { ...get().activeCall, status: "connecting" } });
      debugCall("call accepted", { callId });
    };

    const onAnswer = async ({ callId, answer }) => {
      if (callId !== get().callId || !peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(answer);
        await get().applyPendingIceCandidates();
        debugCall("answer received", { callId });
      } catch {
        get().failCall("Unable to establish the call.");
      }
    };

    const onIceCandidate = async ({ callId, candidate }) => {
      if (callId !== get().callId || !candidate) return;
      debugCall("ICE candidate received", { callId });
      if (!peerConnection?.remoteDescription) {
        pendingIceCandidates.push(candidate);
        return;
      }
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        debugCall("ICE candidate failed", { callId });
      }
    };

    const onConnected = ({ callId, connectedAt }) => {
      if (callId !== get().callId) return;
      set({ connectedAt });
      debugCall("call:connected", { callId, connectedAt });
      if (connectedLocally) {
        set({ status: "connected", activeCall: { ...get().activeCall, status: "connected" } });
        get().startTimer();
      }
    };

    const onRejected = ({ callId }) => {
      if (callId !== get().callId) return;
      toast.error("Call rejected");
      get().cleanupCall("rejected");
    };
    const onEnded = ({ callId, reason, endedAt }) => {
      if (callId !== get().callId) return;
      debugCall("call:ended cleanup started", { callId, reason });
      get().cleanupCall(reason === "disconnected" ? "failed" : "ended", endedAt);
    };
    const onBusy = ({ callId }) => {
      if (callId !== get().callId) return;
      toast.error("User is already on another call");
      get().cleanupCall("busy");
    };
    const onUnavailable = ({ callId }) => {
      if (callId !== get().callId) return;
      toast.error("User is offline");
      get().cleanupCall("missed");
    };
    const onTaken = ({ callId }) => {
      if (callId === get().callId && get().status === "ringing") get().cleanupCall("ended");
    };
    const onSocketDisconnect = () => {
      if (get().status !== "idle") get().cleanupCall("failed");
    };

    const listeners = {
      "call:incoming": onIncoming,
      "call:accepted": onAccepted,
      "call:rejected": onRejected,
      "call:ended": onEnded,
      "call:busy": onBusy,
      "call:unavailable": onUnavailable,
      "call:taken": onTaken,
      "call:connected": onConnected,
      "webrtc:offer": onOffer,
      "webrtc:answer": onAnswer,
      "webrtc:ice-candidate": onIceCandidate,
      disconnect: onSocketDisconnect,
    };
    Object.entries(listeners).forEach(([event, listener]) => socket.on(event, listener));
    socket.__secureChatCallListeners = listeners;
    set({ listenersSocket: socket });
  },

  teardownSocketListeners: () => {
    const socket = get().listenersSocket;
    const listeners = socket?.__secureChatCallListeners;
    if (socket && listeners) {
      Object.entries(listeners).forEach(([event, listener]) => socket.off(event, listener));
      delete socket.__secureChatCallListeners;
    }
    set({ listenersSocket: null });
  },

  startCall: async (user, callType = "video") => {
    const { authUser, socket } = useAuthStore.getState();
    if (!user || !authUser || !socket || get().status !== "idle") return;
    const callId = crypto.randomUUID();
    let localStream;

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
      const activeCall = {
        callId,
        callerId: authUser._id,
        receiverId: user._id,
        recipientId: user._id,
        callerName: authUser.fullName,
        userName: user.fullName,
        callType,
        isVideo: callType === "video",
        status: "outgoing",
      };
      set({
        callId, callType, direction: "outgoing", status: "outgoing",
        caller: authUser, receiver: user, activeCall, incomingCall: null,
        localStream, remoteStream: null, connectedAt: null, endedAt: null,
        error: null, callDuration: 0, isMuted: false, isCameraOff: false,
        isSpeakerOff: false, isScreenSharing: false,
      });
      pendingIceCandidates = [];
      connectedLocally = false;
      connectedEventSent = false;
      endEventSent = false;

      socket.emit("call:start", { callId, callerId: authUser._id, receiverId: user._id, callType });
      const connection = get().createPeerConnection(user._id);
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      socket.emit("webrtc:offer", { callId, callerId: authUser._id, receiverId: user._id, callType, offer });
      debugCall("offer created", { callId });

      noAnswerTimer = setTimeout(() => {
        if (["outgoing", "connecting"].includes(get().status)) {
          get().endCall("missed");
          toast.error("No answer");
        }
      }, 30_000);
    } catch (error) {
      stopStream(localStream);
      socket.emit("call:end", { callId, reason: "failed" });
      get().cleanupCall("failed");
      toast.error(getMediaErrorMessage(error, callType));
    }
  },

  acceptCall: async (callData) => {
    const { authUser, socket } = useAuthStore.getState();
    if (!socket || !authUser || callData?.callId !== get().callId || !callData.offer) {
      toast.error("The call offer is not ready. Please try again.");
      return;
    }
    let localStream;
    try {
      set({ status: "connecting" });
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callData.callType === "video" });
      set({ localStream });
      const connection = get().createPeerConnection(callData.callerId);
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
      await connection.setRemoteDescription(callData.offer);
      await get().applyPendingIceCandidates();
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      const activeCall = { ...callData, userName: callData.callerName, status: "connecting" };
      set({ incomingCall: null, activeCall, status: "connecting" });
      socket.emit("call:accept", { callId: callData.callId, callerId: callData.callerId, receiverId: authUser._id, callType: callData.callType });
      socket.emit("webrtc:answer", { callId: callData.callId, callerId: callData.callerId, receiverId: authUser._id, callType: callData.callType, answer });
      debugCall("answer created", { callId: callData.callId });
    } catch (error) {
      stopStream(localStream);
      socket.emit("call:end", { callId: callData.callId, reason: "failed" });
      get().cleanupCall("failed");
      toast.error(getMediaErrorMessage(error, callData.callType));
    }
  },

  rejectCall: (callData) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || callData?.callId !== get().callId) return;
    socket.emit("call:reject", { callId: callData.callId, callerId: callData.callerId, receiverId: callData.receiverId, callType: callData.callType });
    get().cleanupCall("rejected");
  },

  endCall: (reason = "ended") => {
    const socket = useAuthStore.getState().socket;
    const callId = get().callId;
    if (socket && callId && !endEventSent) {
      endEventSent = true;
      socket.emit("call:end", { callId, reason });
    }
    get().cleanupCall(reason);
  },

  failCall: (message) => {
    if (get().status === "idle") return;
    toast.error(message);
    get().endCall("failed");
  },

  cleanupCall: (status = "ended", endedAt = Date.now()) => {
    const callId = get().callId;
    debugCall("cleanup started", { callId, status, endedAt });
    clearCallTimers();
    const connection = peerConnection;
    peerConnection = null;
    if (connection) {
      connection.onconnectionstatechange = null;
      connection.oniceconnectionstatechange = null;
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.close();
    }
    stopStream(get().localStream);
    stopStream(get().remoteStream);
    stopStream(screenStream);
    screenStream = null;
    pendingIceCandidates = [];
    connectedLocally = false;
    connectedEventSent = false;
    endEventSent = false;
    set({
      callId: null, callType: null, direction: null, status: "idle",
      caller: null, receiver: null, activeCall: null, incomingCall: null,
      localStream: null, remoteStream: null, connectedAt: null, endedAt,
      error: status === "failed" ? "Call failed" : null, callDuration: 0,
      isMuted: false, isCameraOff: false, isSpeakerOff: false,
      isScreenSharing: false, isFullscreen: false,
    });
    debugCall("store reset complete", { callId, status });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    get().localStream?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    set({ isMuted: nextMuted });
  },

  toggleCamera: () => {
    const nextOff = !get().isCameraOff;
    get().localStream?.getVideoTracks().forEach((track) => { track.enabled = !nextOff; });
    set({ isCameraOff: nextOff });
  },

  toggleSpeaker: () => set((state) => ({ isSpeakerOff: !state.isSpeakerOff })),

  switchCamera: async () => {
    if (get().callType !== "video" || !peerConnection) return;
    try {
      const currentTrack = get().localStream?.getVideoTracks()[0];
      const facingMode = currentTrack?.getSettings().facingMode === "environment" ? "user" : "environment";
      const replacement = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      const replacementTrack = replacement.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(({ track }) => track?.kind === "video");
      await sender?.replaceTrack(replacementTrack);
      currentTrack?.stop();
      const stream = new MediaStream([...get().localStream.getAudioTracks(), replacementTrack]);
      set({ localStream: stream, isCameraOff: false });
    } catch {
      toast.error("Unable to switch camera");
    }
  },

  toggleScreenShare: async () => {
    if (!peerConnection || get().callType !== "video") return;
    const sender = peerConnection.getSenders().find(({ track }) => track?.kind === "video");
    if (get().isScreenSharing) {
      const cameraTrack = get().localStream?.getVideoTracks()[0];
      if (cameraTrack) await sender?.replaceTrack(cameraTrack);
      set({ isScreenSharing: false });
      stopStream(screenStream);
      screenStream = null;
      return;
    }
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      await sender?.replaceTrack(screenTrack);
      screenTrack.onended = () => get().toggleScreenShare();
      set({ isScreenSharing: true });
    } catch {
      stopStream(screenStream);
      screenStream = null;
    }
  },

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
