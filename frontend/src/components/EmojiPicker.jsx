import { useMemo, useState } from "react";
import { SearchIcon, SparklesIcon, XIcon } from "lucide-react";

const emojiGroups = [
  { label: "Frequently used", emojis: ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "😄", "😍"] },
  { label: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "☺️", "🙂", "🙃", "😉", "😇", "😍"] },
  { label: "Hands", emojis: ["👍", "👎", "👌", "✌️", "🤝", "🙏", "👏", "🙌", "💪", "👋"] },
  { label: "Hearts", emojis: ["❤️", "💛", "💚", "💙", "💜", "🧡", "💖", "💗", "💘", "💝"] },
  { label: "People", emojis: ["😎", "🤓", "🧑‍💻", "👨‍👩‍👧‍👦", "👩‍💻", "🧠", "🤖", "👋", "🤗", "😴"] },
];

function EmojiPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return emojiGroups;
    const term = query.toLowerCase();
    return emojiGroups
      .map((group) => ({
        ...group,
        emojis: group.emojis.filter((emoji) => emoji.toLowerCase().includes(term)),
      }))
      .filter((group) => group.emojis.length > 0);
  }, [query]);

  return (
    <div className="absolute bottom-20 right-0 z-20 w-[320px] rounded-[1.25rem] border border-white/[0.08] bg-slate-950/95 p-3 shadow-[0_20px_50px_rgba(2,6,23,0.4)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
          <SparklesIcon className="h-4 w-4 text-cyan-300" />
          Emoji picker
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100" type="button" aria-label="Close emoji picker">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-400">
        <SearchIcon className="h-4 w-4" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Search emojis" />
      </label>

      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.emojis.map((emoji) => (
                <button key={emoji} type="button" onClick={() => onSelect(emoji)} className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-xl transition hover:scale-105 hover:border-cyan-400/30">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
