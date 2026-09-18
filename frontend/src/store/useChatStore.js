import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const RECORDING_ACTIVITY_TIMEOUT_MS = 12000;
const recordingActivityTimers = new Map();

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  groups: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  voiceUploadProgress: null,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  typingUsers: {},
  recordingUsers: {},
  lastSeenMap: {},
  setRecordingActivity: ({ senderId, activityId }) => {
    if (!senderId || !activityId) return;
    const timerKey = `${senderId}:${activityId}`;
    window.clearTimeout(recordingActivityTimers.get(timerKey));
    set((state) => ({
      typingUsers: { ...state.typingUsers, [senderId]: false },
      recordingUsers: {
        ...state.recordingUsers,
        [senderId]: { ...state.recordingUsers[senderId], [activityId]: Date.now() + RECORDING_ACTIVITY_TIMEOUT_MS },
      },
    }));
    recordingActivityTimers.set(timerKey, window.setTimeout(() => {
      get().clearRecordingActivity({ senderId, activityId });
    }, RECORDING_ACTIVITY_TIMEOUT_MS));
  },
  clearRecordingActivity: ({ senderId, activityId }) => {
    if (!senderId || !activityId) return;
    const timerKey = `${senderId}:${activityId}`;
    window.clearTimeout(recordingActivityTimers.get(timerKey));
    recordingActivityTimers.delete(timerKey);
    set((state) => {
      const senderActivities = { ...state.recordingUsers[senderId] };
      delete senderActivities[activityId];
      const recordingUsers = { ...state.recordingUsers };
      if (Object.keys(senderActivities).length) recordingUsers[senderId] = senderActivities;
      else delete recordingUsers[senderId];
      return { recordingUsers };
    });
  },
  clearRecordingUser: (senderId) => {
    if (!senderId) return;
    for (const timerKey of recordingActivityTimers.keys()) {
      if (timerKey.startsWith(`${senderId}:`)) {
        window.clearTimeout(recordingActivityTimers.get(timerKey));
        recordingActivityTimers.delete(timerKey);
      }
    }
    set((state) => {
      const recordingUsers = { ...state.recordingUsers };
      delete recordingUsers[senderId];
      return { recordingUsers };
    });
  },
  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup, selectedUser: null }),

  getMyGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
      const socket = useAuthStore.getState().socket;
      socket?.off("group:created");
      socket?.on("group:created", (group) => {
        set((state) => ({ groups: [group, ...state.groups.filter(({ _id }) => _id !== group._id)] }));
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load groups");
    }
  },
  createGroup: async (data) => {
    try {
      const res = await axiosInstance.post("/groups", data);
      set((state) => ({ groups: [res.data, ...state.groups.filter((group) => group._id !== res.data._id)] }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create group");
      return null;
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const normalizedMessages = res.data.map((message) => message.messageStatus === "delivered" ? { ...message, messageStatus: "sent" } : message);
      set({ messages: normalizedMessages });
      return normalizedMessages;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const isVoiceMessage = Boolean(messageData.audio?.blob);

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      messageType: isVoiceMessage ? "audio" : messageData.attachment ? "file" : messageData.image ? "image" : "text",
      attachment: isVoiceMessage ? { type: "audio", mimeType: messageData.audio.mimeType, size: messageData.audio.blob.size } : null,
      metadata: isVoiceMessage ? { audioUrl: messageData.audio.previewUrl, duration: messageData.audio.duration } : {},
      createdAt: new Date().toISOString(),
      messageStatus: "sent",
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });
    if (isVoiceMessage) set({ voiceUploadProgress: 0 });

    try {
      const res = isVoiceMessage
        ? await axiosInstance.post(`/messages/send-voice/${selectedUser._id}`, messageData.audio.blob, {
            headers: {
              "Content-Type": messageData.audio.mimeType,
              "X-Audio-Duration": String(messageData.audio.duration),
            },
            onUploadProgress: (event) => {
              if (event.total) set({ voiceUploadProgress: Math.round((event.loaded / event.total) * 100) });
            },
          })
        : await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({ messages: state.messages.map((message) => (message._id === tempId ? res.data : message)) }));
      if (isVoiceMessage) set({ voiceUploadProgress: null });
      return true;
    } catch (error) {
      set((state) => ({ messages: state.messages.filter((message) => message._id !== tempId) }));
      if (isVoiceMessage) set({ voiceUploadProgress: null });
      toast.error(error.response?.data?.message || "Something went wrong");
      return false;
    }
  },

  reactToMessage: async (messageId, emoji) => {
    const previousMessages = get().messages;
    const { authUser } = useAuthStore.getState();
    set({
      messages: previousMessages.map((message) => {
        if (message._id !== messageId) return message;
        const reactions = message.reactions || [];
        const hasReaction = reactions.some((reaction) => reaction.emoji === emoji && reaction.userId === authUser._id);
        return {
          ...message,
          reactions: hasReaction
            ? reactions.filter((reaction) => !(reaction.emoji === emoji && reaction.userId === authUser._id))
            : [...reactions, { emoji, userId: authUser._id }],
        };
      }),
    });
    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
      set((state) => ({ messages: state.messages.map((message) => (message._id === messageId ? res.data : message)) }));
    } catch (error) {
      set({ messages: previousMessages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      set((state) => ({ messages: state.messages.map((message) => (message._id === messageId ? res.data : message)) }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      return false;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, messages } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedGroup) return false;
    const tempId = `temp-group-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser,
      groupId: selectedGroup._id,
      text: messageData.text,
      image: messageData.image,
      messageType: messageData.image ? "image" : "text",
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    set({ messages: [...messages, optimisticMessage] });
    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
      set((state) => ({ messages: state.messages.map((message) => message._id === tempId ? res.data : message) }));
      return true;
    } catch (error) {
      set((state) => ({ messages: state.messages.filter((message) => message._id !== tempId) }));
      toast.error(error.response?.data?.message || "Unable to send group message");
      return false;
    }
  },

  deleteMessage: async (messageId, scope = "me") => {
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`, { data: { scope } });
      set((state) => ({
        messages: scope === "me"
          ? state.messages.filter((message) => message._id !== messageId)
          : state.messages.map((message) => (message._id === messageId ? res.data : message)),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  pinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/messages/pin/${messageId}`);
      set((state) => ({ messages: state.messages.map((message) => (message._id === messageId ? res.data : message)) }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  markMessagesSeen: async (userId) => {
    const { authUser } = useAuthStore.getState();
    const unreadIds = get().messages
      .filter((message) => message.senderId === userId && message.receiverId === authUser?._id && message.messageStatus !== "seen")
      .map((message) => String(message._id));
    if (!unreadIds.length) return [];

    try {
      const res = await axiosInstance.patch(`/messages/${userId}/seen`);
      const seenIds = new Set((res.data.messageIds || []).map(String));
      if (seenIds.size) {
        set((state) => ({
          messages: state.messages.map((message) => seenIds.has(String(message._id)) ? { ...message, messageStatus: "seen" } : message),
        }));
      }
      return [...seenIds];
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.off("newMessage");
    socket.off("messageSeen");
    socket.off("typing");
    socket.off("messageUpdated");
    socket.off("messageDeletedForMe");
    socket.off("voice:recording:start");
    socket.off("voice:recording:stop");

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });
      if (document.visibilityState === "visible" && document.hasFocus()) get().markMessagesSeen(selectedUser._id);

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });

    socket.on("messageSeen", ({ conversationUserId, messageIds }) => {
      if (conversationUserId !== selectedUser._id) return;
      const updatedIds = new Set((messageIds || []).map(String));
      set((state) => ({
        messages: state.messages.map((message) => updatedIds.has(String(message._id)) ? { ...message, messageStatus: "seen" } : message),
      }));
    });

    socket.on("typing", ({ senderId, isTyping }) => {
      set((state) => ({ typingUsers: { ...state.typingUsers, [senderId]: isTyping } }));
      if (!isTyping) {
        set((state) => ({ typingUsers: { ...state.typingUsers, [senderId]: false } }));
      }
    });

    socket.on("voice:recording:start", (activity) => {
      if (activity.senderId !== selectedUser._id) return;
      get().setRecordingActivity(activity);
    });

    socket.on("voice:recording:stop", (activity) => {
      get().clearRecordingActivity(activity);
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((message) => (message._id === updatedMessage._id ? updatedMessage : message)),
      }));
    });

    socket.on("messageDeletedForMe", ({ messageId }) => {
      set((state) => ({ messages: state.messages.filter((message) => message._id !== messageId) }));
    });
  },

  unsubscribeFromMessages: () => {
    const selectedUserId = get().selectedUser?._id;
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageSeen");
    socket.off("typing");
    socket.off("messageUpdated");
    socket.off("messageDeletedForMe");
    socket.off("voice:recording:start");
    socket.off("voice:recording:stop");
    get().clearRecordingUser(selectedUserId);
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("group:message");
    socket.on("group:message", (message) => {
      if (String(message.groupId) !== String(get().selectedGroup?._id)) return;
      if (get().messages.some(({ _id }) => _id === message._id)) return;
      set((state) => ({ messages: [...state.messages, message] }));
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("group:message");
  },
}));
