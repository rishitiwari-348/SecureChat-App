import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <button
              className="group relative size-12 overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-[0_0_36px_rgba(34,211,238,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
              onClick={() => fileInputRef.current.click()}
            >
              <img src={selectedImg || authUser.profilePic || "/avatar.png"} alt="User image" className="size-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="text-[10px] font-medium text-white">Edit</span>
              </div>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.28em] text-cyan-300/80">Workspace</p>
            <h3 className="truncate text-sm font-semibold tracking-tight text-slate-50">{authUser.fullName}</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-emerald-400"></span>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="chat-icon-button"
            aria-label={isSoundEnabled ? "Mute interface sounds" : "Enable interface sounds"}
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? <Volume2Icon className="size-4" /> : <VolumeOffIcon className="size-4" />}
          </button>
          <button
            className="chat-icon-button hover:!border-red-400/20 hover:!bg-red-500/10 hover:!text-red-300"
            onClick={logout}
            aria-label="Log out"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
