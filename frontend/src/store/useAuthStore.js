import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { API_SERVER_URL } from "../lib/apiUrl";

const BASE_URL = API_SERVER_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  oauthLoadingProvider: null,
  socket: null,
  onlineUsers: [],
  presenceMap: {},

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: null });
      toast.success(res.data.message || "Account created. Please verify your email before signing in.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create account");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, oauthLoadingProvider: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  continueWithOAuth: (provider) => {
    if (get().oauthLoadingProvider) return;

    set({ oauthLoadingProvider: provider });
    try {
      window.location.assign(`${BASE_URL}/api/auth/oauth/${provider}`);
    } catch (error) {
      set({ oauthLoadingProvider: null });
      toast.error("Unable to start OAuth sign-in. Please try again.");
      console.log("OAuth navigation error:", error);
    }
  },

  resetOAuthLoading: () => set({ oauthLoadingProvider: null }),

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response.data.message);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
    });

    socket.connect();

    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("presenceUpdated", ({ userId, presenceStatus, lastSeenAt }) => {
      set((state) => ({
        presenceMap: { ...state.presenceMap, [userId]: { presenceStatus, lastSeenAt } },
      }));
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
