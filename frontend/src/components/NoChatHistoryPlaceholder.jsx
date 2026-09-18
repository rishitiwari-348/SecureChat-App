import { MessageCircleHeartIcon, ShieldCheckIcon } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-indigo-500/15 shadow-[0_14px_40px_rgba(34,211,238,0.10)]">
        <MessageCircleHeartIcon className="size-8 text-cyan-200" />
      </div>
      <span className="mb-3 text-[9px] font-medium uppercase tracking-[0.28em] text-cyan-300">New conversation</span>
      <h3 className="mb-3 text-xl font-semibold tracking-tight text-slate-50">Start your conversation with {name}</h3>
      <div className="mb-5 flex max-w-md flex-col space-y-3">
        <p className="text-sm leading-7 text-slate-400">
          This is the beginning of your conversation. Send a message to start chatting.
        </p>
        <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheckIcon className="size-3.5 text-cyan-300/70" /> A private space for you and {name}</p>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
