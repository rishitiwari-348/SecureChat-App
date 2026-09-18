import { MessageCircleHeartIcon, UsersIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-indigo-500/15 shadow-[0_14px_40px_rgba(34,211,238,0.10)]">
        <MessageCircleHeartIcon className="h-8 w-8 text-cyan-200" />
      </div>
      <div>
        <h4 className="mb-1 text-sm font-semibold text-slate-100">No conversations yet</h4>
        <p className="px-6 text-sm leading-6 text-slate-400">
          Start a new chat by selecting a contact from the contacts tab.
        </p>
      </div>
      <button
        onClick={() => setActiveTab("contacts")}
        type="button"
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <UsersIcon className="size-4" /> Find contacts
      </button>
    </div>
  );
}
export default NoChatsFound;
