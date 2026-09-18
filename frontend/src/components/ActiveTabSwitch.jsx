import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="mx-1 mb-2 flex rounded-2xl border border-white/[0.09] bg-slate-950/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur-xl" role="tablist" aria-label="Conversation navigation">
      <button
        onClick={() => setActiveTab("chats")}
        type="button"
        role="tab"
        aria-selected={activeTab === "chats"}
        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
          activeTab === "chats"
            ? "bg-gradient-to-r from-cyan-400/20 via-cyan-500/15 to-indigo-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_8px_24px_rgba(34,211,238,0.08)]"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        type="button"
        role="tab"
        aria-selected={activeTab === "contacts"}
        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
          activeTab === "contacts"
            ? "bg-gradient-to-r from-cyan-400/20 via-cyan-500/15 to-indigo-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_8px_24px_rgba(34,211,238,0.08)]"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
