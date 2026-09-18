import { CameraIcon, MicIcon, PhoneOffIcon, PhoneIcon, ScreenShareIcon, VideoIcon } from "lucide-react";

function CallModal({ call, onAccept, onReject, isIncoming, onCancel }) {
  if (!call) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-slate-900/90 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{isIncoming ? "Incoming call" : "Calling"}</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{call.callerName || call.userName}</h3>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-200">
            {call.isVideo ? <VideoIcon className="h-6 w-6" /> : <PhoneIcon className="h-6 w-6" />}
          </div>
        </div>

        <div className="mb-5 flex items-center justify-center rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 p-8 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-white">{call.callerName?.[0] || "U"}</div>
            <p className="text-sm text-slate-300">{isIncoming ? "Accept to join the conversation" : "Ringing on the other end"}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1"><MicIcon className="h-4 w-4" /> Mic</span>
          <span className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1"><CameraIcon className="h-4 w-4" /> Camera</span>
          <span className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1"><ScreenShareIcon className="h-4 w-4" /> Share</span>
        </div>

        <div className="flex justify-center gap-4">
          {isIncoming ? (
            <>
              <button type="button" onClick={() => onAccept(call)} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.25)]">
                <PhoneIcon className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => onReject(call)} className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]">
                <PhoneOffIcon className="h-6 w-6" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => onCancel(call)} className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)]">
              <PhoneOffIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallModal;
