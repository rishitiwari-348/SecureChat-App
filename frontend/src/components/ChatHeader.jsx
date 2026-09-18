import { PhoneIcon, VideoIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const startCall = useCallStore((state) => state.startCall);
  const { onlineUsers, presenceMap } = useAuthStore();
  const presence = presenceMap[selectedUser._id] || {};
  const isOnline = onlineUsers.includes(selectedUser._id);
  const lastSeenLabel = presence.lastSeenAt ? new Date(presence.lastSeenAt).toLocaleString() : "Recently active";

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="sticky top-0 z-10 flex max-h-[88px] flex-none items-center justify-between border-b border-white/[0.08] bg-slate-950/55 px-4 py-3.5 shadow-[0_10px_30px_rgba(2,6,23,0.12)] backdrop-blur-2xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-11 rounded-2xl ring-1 ring-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,0.10)]">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-slate-50">{selectedUser.fullName}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400"><span className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-600"}`} />{isOnline ? "Online now" : `Last seen ${lastSeenLabel}`}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => startCall(selectedUser, "voice")}
          className="chat-icon-button size-9"
          aria-label="Start voice call"
        >
          <PhoneIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => startCall(selectedUser, "video")}
          className="chat-icon-button size-9"
          aria-label="Start video call"
        >
          <VideoIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          type="button"
          className="chat-icon-button size-9"
          aria-label="Close conversation"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
