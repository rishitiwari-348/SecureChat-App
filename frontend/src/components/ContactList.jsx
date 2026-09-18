import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-2 px-1 py-1">
      {allContacts.map((contact) => {
        const isActive = selectedUser?._id === contact._id;
        const isOnline = onlineUsers.includes(contact._id);

        return (
          <button
            key={contact._id}
            type="button"
            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
              isActive
                ? "border-cyan-400/20 bg-gradient-to-r from-cyan-400/[0.16] to-indigo-500/[0.16] text-cyan-50 shadow-[0_12px_34px_rgba(34,211,238,0.08)]"
                : "border-transparent bg-white/[0.015] text-slate-200 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.05]"
            }`}
            onClick={() => setSelectedUser(contact)}
          >
            {isActive && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />}
            <div className="relative shrink-0">
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="size-12 rounded-2xl ring-1 ring-white/[0.10]">
                  <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} className="h-full w-full object-cover" />
                </div>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${isOnline ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" : "bg-slate-600"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`truncate text-sm ${isActive ? "font-semibold text-cyan-50" : "font-medium text-slate-200"}`}>
                  {contact.fullName}
                </h4>
                <span className={`text-[10px] uppercase tracking-[0.12em] ${isActive ? "text-cyan-200/80" : "text-slate-500"}`}>
                  {isOnline ? "Online" : "Away"}
                </span>
              </div>
              <p className={`mt-1 truncate text-sm ${isActive ? "text-cyan-100/80" : "text-slate-400"}`}>
                {isOnline ? "Available to chat" : "Open to connect"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
export default ContactList;
