import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { PlusIcon, UsersIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

function ChatsList() {
  const { getMyChatPartners, getMyGroups, chats, groups, isUsersLoading, setSelectedUser, selectedUser, setSelectedGroup, selectedGroup } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    getMyChatPartners();
    getMyGroups();
  }, [getMyChatPartners, getMyGroups]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  return (
    <div className="space-y-2 px-1 py-1">
      <button type="button" onClick={() => setShowCreateGroup(true)} className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-400/10"><PlusIcon className="size-4" /> Create group</button>
      {groups.map((group) => {
        const isActive = selectedGroup?._id === group._id;
        return (
          <button key={group._id} type="button" onClick={() => setSelectedGroup(group)} className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${isActive ? "border-cyan-400/20 bg-gradient-to-r from-cyan-400/[0.16] to-indigo-500/[0.16]" : "border-transparent bg-white/[0.015] hover:border-white/[0.08] hover:bg-white/[0.05]"}`}>
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-cyan-400/10 text-cyan-200">{group.avatar ? <img src={group.avatar} alt="" className="h-full w-full object-cover" /> : <UsersIcon className="size-5" />}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{group.name}</p><p className="mt-1 text-xs text-slate-400">{group.members.length} members</p></div>
          </button>
        );
      })}
      {chats.length === 0 && groups.length === 0 ? <NoChatsFound /> : null}
      {chats.map((chat) => {
        const isActive = selectedUser?._id === chat._id;
        const isOnline = onlineUsers.includes(chat._id);

        return (
          <button
            key={chat._id}
            type="button"
            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
              isActive
                ? "border-cyan-400/20 bg-gradient-to-r from-cyan-400/[0.16] to-indigo-500/[0.16] text-cyan-50 shadow-[0_12px_34px_rgba(34,211,238,0.08)]"
                : "border-transparent bg-white/[0.015] text-slate-200 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.05]"
            }`}
            onClick={() => setSelectedUser(chat)}
          >
            {isActive && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />}
            <div className="relative shrink-0">
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="size-12 rounded-2xl ring-1 ring-white/[0.10]">
                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} className="h-full w-full object-cover" />
                </div>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${isOnline ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" : "bg-slate-600"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`truncate text-sm ${isActive ? "font-semibold text-cyan-50" : "font-medium text-slate-200"}`}>
                  {chat.fullName}
                </h4>
                <span className={`text-[10px] uppercase tracking-[0.12em] ${isActive ? "text-cyan-200/80" : "text-slate-500"}`}>Now</span>
              </div>
              <p className={`mt-1 truncate text-sm ${isActive ? "text-cyan-100/80" : "text-slate-400"}`}>
                {isActive ? "Active now" : "Tap to continue"}
              </p>
            </div>
          </button>
        );
      })}
      {showCreateGroup ? <CreateGroupModal onClose={() => setShowCreateGroup(false)} /> : null}
    </div>
  );
}
export default ChatsList;
