import { CameraIcon, CameraOffIcon, Maximize2Icon, MicIcon, MicOffIcon, MonitorUpIcon, PhoneOffIcon, ScreenShareIcon, SpeakerIcon, VideoIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function CallPanel({ call, localStream, remoteStream, onEnd, onToggleMute, onToggleCamera, onSwitchCamera, onToggleSpeaker, onToggleScreenShare, onToggleFullscreen, isMuted, isCameraOff, isSpeakerOff, isScreenSharing, connectionState, duration }) {
  const remoteMediaRef = useRef(null);
  const desktopLocalVideoRef = useRef(null);
  const compactLocalVideoRef = useRef(null);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    const media = remoteMediaRef.current;
    if (!media) return;
    media.srcObject = remoteStream || null;
    media.muted = isSpeakerOff;
    if (remoteStream) media.play().then(() => setMediaError(false)).catch(() => setMediaError(true));
    return () => { media.srcObject = null; };
  }, [remoteStream, isSpeakerOff, call.isVideo]);

  useEffect(() => {
    const videos = [desktopLocalVideoRef.current, compactLocalVideoRef.current].filter(Boolean);
    videos.forEach((video) => {
      video.srcObject = localStream || null;
      if (localStream) video.play().catch(() => {});
    });
    return () => videos.forEach((video) => { video.srcObject = null; });
  }, [localStream]);

  return (
    <div className="fixed inset-0 z-[70] flex h-[100dvh] items-center justify-center overflow-hidden bg-slate-950/90 p-0 backdrop-blur-xl sm:p-3">
      <div className="flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden border border-white/[0.08] bg-slate-900/90 shadow-[0_24px_80px_rgba(2,6,23,0.45)] sm:rounded-[2rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 text-sm text-slate-300">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{call.isVideo ? "Video call" : "Voice call"}</p>
            <p className="font-medium text-white">{call.callerName || call.userName}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            {connectionState}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_40%)] p-2 sm:p-3">
          {call.isVideo ? (
            <div className="relative h-full min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr),280px] lg:gap-3">
              <div className="relative h-full min-h-0 overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-slate-950">
                {remoteStream ? (
                  <video ref={remoteMediaRef} autoPlay playsInline muted={isSpeakerOff} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">Connecting...</div>
                )}
                <div className="absolute right-3 top-3 rounded-full border border-white/[0.08] bg-slate-950/80 px-3 py-1 text-sm text-slate-200">{duration}</div>
                <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.08] bg-slate-950/80 px-3 py-1 text-sm text-slate-200">Network: Good</div>
              </div>
              <div className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
                <div className="relative h-40 overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-slate-950">
                  {localStream ? (
                    <video ref={desktopLocalVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">Camera unavailable</div>
                  )}
                </div>
                <div className="flex-1 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.04] p-3 text-sm text-slate-300">
                  <p className="font-medium text-white">Controls</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={onToggleMute} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 text-left">
                      {isMuted ? <MicOffIcon className="mb-2 h-4 w-4" /> : <MicIcon className="mb-2 h-4 w-4" />}<div className="text-xs">{isMuted ? "Unmute" : "Mute"}</div>
                    </button>
                    <button type="button" onClick={onToggleCamera} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 text-left">
                      {isCameraOff ? <CameraOffIcon className="mb-2 h-4 w-4" /> : <CameraIcon className="mb-2 h-4 w-4" />}<div className="text-xs">{isCameraOff ? "Camera off" : "Camera on"}</div>
                    </button>
                    <button type="button" onClick={onSwitchCamera} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 text-left"><VideoIcon className="mb-2 h-4 w-4" /><div className="text-xs">Switch camera</div></button>
                    <button type="button" onClick={onToggleScreenShare} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 text-left">{isScreenSharing ? <MonitorUpIcon className="mb-2 h-4 w-4" /> : <ScreenShareIcon className="mb-2 h-4 w-4" />}<div className="text-xs">{isScreenSharing ? "Sharing" : "Share screen"}</div></button>
                  </div>
                  <button type="button" onClick={() => onEnd("ended")} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-2.5 font-medium text-white shadow-[0_10px_30px_rgba(244,63,94,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/80" aria-label="End call"><PhoneOffIcon className="h-5 w-5" /> End call</button>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 h-28 w-24 overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-950 shadow-[0_12px_35px_rgba(2,6,23,0.45)] sm:h-36 sm:w-28 lg:hidden">
                {localStream ? (
                  <video ref={compactLocalVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-400">Camera unavailable</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-6 text-center">
              <audio ref={remoteMediaRef} autoPlay playsInline muted={isSpeakerOff} />
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl text-white">{call.callerName?.[0] || "U"}</div>
              <p className="text-xl font-semibold text-white">{call.callerName || call.userName}</p>
              <p className="mt-2 text-sm text-slate-400">{duration}</p>
              {mediaError ? <p className="mt-2 text-xs text-amber-300">Audio playback was blocked. Use the speaker control and try again.</p> : null}
            </div>
          )}
        </div>

        <div className={`relative z-20 shrink-0 border-t border-white/[0.08] bg-slate-950/75 px-3 pt-2.5 backdrop-blur-xl sm:px-4 sm:pt-3 ${call.isVideo ? "lg:hidden" : ""}`} style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
          <div className="mb-2 flex justify-center sm:hidden">
            <button type="button" onClick={() => onEnd("ended")} className="flex size-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/80" aria-label="End call"><PhoneOffIcon className="h-5 w-5" /></button>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:justify-center sm:gap-3">
            <div className="premium-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:contents">
              <button type="button" onClick={onToggleMute} className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] ${isMuted ? "bg-rose-500/20 text-rose-200" : "bg-white/[0.06] text-slate-200"}`} aria-label={isMuted ? "Unmute" : "Mute"}><MicIcon className="h-5 w-5" /></button>
              <button type="button" onClick={onToggleSpeaker} className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] ${isSpeakerOff ? "bg-rose-500/20 text-rose-200" : "bg-white/[0.06] text-slate-200"}`} aria-label={isSpeakerOff ? "Turn speaker on" : "Turn speaker off"}><SpeakerIcon className="h-5 w-5" /></button>
              {call.isVideo ? <button type="button" onClick={onToggleCamera} className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] ${isCameraOff ? "bg-rose-500/20 text-rose-200" : "bg-white/[0.06] text-slate-200"}`} aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}><CameraIcon className="h-5 w-5" /></button> : null}
              {call.isVideo ? <button type="button" onClick={onSwitchCamera} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-slate-200 lg:hidden" aria-label="Switch camera"><VideoIcon className="h-5 w-5" /></button> : null}
              {call.isVideo ? <button type="button" onClick={onToggleScreenShare} className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] lg:hidden ${isScreenSharing ? "bg-cyan-500/20 text-cyan-200" : "bg-white/[0.06] text-slate-200"}`} aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}>{isScreenSharing ? <MonitorUpIcon className="h-5 w-5" /> : <ScreenShareIcon className="h-5 w-5" />}</button> : null}
              <button type="button" onClick={onToggleFullscreen} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-slate-200" aria-label="Toggle fullscreen"><Maximize2Icon className="h-5 w-5" /></button>
            </div>
            <button type="button" onClick={() => onEnd("ended")} className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/80 sm:flex" aria-label="End call"><PhoneOffIcon className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallPanel;
