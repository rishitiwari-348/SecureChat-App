import { LockKeyholeIcon, MessageCircleHeartIcon, SparklesIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
      <div className="relative mb-7">
        <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/20 blur-2xl" />
        <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-indigo-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(34,211,238,0.10)] backdrop-blur-xl">
          <MessageCircleHeartIcon className="size-11 text-cyan-200" />
          <SparklesIcon className="absolute right-4 top-4 size-4 text-indigo-300" />
        </div>
      </div>
      <span className="mb-3 rounded-full border border-cyan-400/15 bg-cyan-400/[0.07] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.28em] text-cyan-300">Private workspace</span>
      <h3 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">Select a conversation</h3>
      <p className="max-w-md text-sm leading-7 text-slate-400">
        Choose a contact from the sidebar to continue an existing thread or start a new one.
      </p>
      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><LockKeyholeIcon className="size-3.5 text-cyan-300/70" /> Your conversations stay private.</p>
    </div>
  );
};

export default NoConversationPlaceholder;
