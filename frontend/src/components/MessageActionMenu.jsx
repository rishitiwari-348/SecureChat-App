import { useEffect, useRef, useState } from "react";
import { Edit3Icon, EllipsisIcon, PinIcon, SmilePlusIcon, Trash2Icon, XIcon } from "lucide-react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function MessageActionMenu({ message, isOwn, isOpen, onOpen, onClose, onReact, onEdit, onDelete, onPin }) {
  const menuRef = useRef(null);
  const [showDeleteChoices, setShowDeleteChoices] = useState(false);
  const isDeleted = message.deleted && message.deletedFor === "everyone";
  const canEdit = isOwn && Boolean(message.text) && !isDeleted;

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteChoices(false);
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose();
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (isDeleted) return null;

  return (
    <div ref={menuRef} className={`absolute -top-3 z-30 ${isOwn ? "right-1" : "left-1"}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          isOpen ? onClose() : onOpen();
        }}
        className={`message-action-trigger flex size-7 items-center justify-center rounded-full border border-white/10 bg-slate-950/90 text-slate-300 shadow-lg transition hover:text-cyan-200 focus-visible:opacity-100 ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <XIcon className="size-3.5" /> : <EllipsisIcon className="size-4" />}
      </button>

      {isOpen ? (
        <div role="menu" className={`absolute top-9 w-48 rounded-xl border border-white/10 bg-slate-950/95 p-1.5 text-sm text-slate-200 shadow-2xl backdrop-blur-xl ${isOwn ? "right-0" : "left-0"}`}>
          <div className="mb-1 flex items-center justify-between gap-1 border-b border-white/10 px-1 pb-1.5" aria-label="Choose a reaction">
            {REACTIONS.map((emoji) => (
              <button key={emoji} type="button" onClick={() => { onReact(emoji); onClose(); }} className="flex size-7 items-center justify-center rounded-lg hover:bg-white/10" aria-label={`React with ${emoji}`}>
                {emoji}
              </button>
            ))}
          </div>
          {canEdit ? <button role="menuitem" type="button" onClick={() => { onEdit(); onClose(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/10"><Edit3Icon className="size-4" /> Edit</button> : null}
          <button role="menuitem" type="button" onClick={() => { onPin(); onClose(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/10"><PinIcon className="size-4" /> {message.pinned ? "Unpin" : "Pin"}</button>
          <button role="menuitem" type="button" onClick={() => setShowDeleteChoices((value) => !value)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-rose-200 hover:bg-rose-500/10"><Trash2Icon className="size-4" /> Delete</button>
          {showDeleteChoices ? (
            <div className="mt-1 border-t border-white/10 pt-1">
              <button type="button" onClick={() => { onDelete("me"); onClose(); }} className="w-full rounded-lg px-2.5 py-2 text-left text-xs hover:bg-white/10">Delete for me</button>
              {isOwn ? <button type="button" onClick={() => { onDelete("everyone"); onClose(); }} className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-rose-200 hover:bg-rose-500/10">Delete for everyone</button> : null}
            </div>
          ) : null}
          <span className="sr-only"><SmilePlusIcon />Reaction options</span>
        </div>
      ) : null}
    </div>
  );
}

export default MessageActionMenu;
