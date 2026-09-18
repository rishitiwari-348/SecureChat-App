import { useEffect, useState } from "react";
import { LoaderIcon, UsersIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function CreateGroupModal({ onClose }) {
  const { allContacts, getAllContacts, createGroup, setSelectedGroup } = useChatStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [query, setQuery] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { getAllContacts(); }, [getAllContacts]);

  const filteredContacts = allContacts.filter(({ fullName, email }) => `${fullName} ${email}`.toLowerCase().includes(query.toLowerCase()));
  const submit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2 || memberIds.length < 2 || isCreating) return;
    setIsCreating(true);
    const group = await createGroup({ name: name.trim(), description: description.trim(), memberIds, avatar });
    setIsCreating(false);
    if (group) {
      setSelectedGroup(group);
      onClose();
    }
  };

  const readAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
      <form onSubmit={submit} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-white/[0.10] bg-slate-900/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">New conversation</p><h2 id="create-group-title" className="mt-1 text-xl font-semibold text-white">Create group</h2></div>
          <button type="button" onClick={onClose} className="chat-icon-button size-9" aria-label="Close"><XIcon className="size-4" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Group name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Description (optional)" className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40" />
          <label className="block text-sm text-slate-300">Group avatar (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={readAvatar} className="mt-2 block w-full text-xs text-slate-400" /></label>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none" />
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-white/10 p-2">
            {filteredContacts.map((contact) => (
              <label key={contact._id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                <input type="checkbox" checked={memberIds.includes(contact._id)} onChange={() => setMemberIds((ids) => ids.includes(contact._id) ? ids.filter((id) => id !== contact._id) : [...ids, contact._id])} />
                <img src={contact.profilePic || "/avatar.png"} alt="" className="size-8 rounded-xl object-cover" />
                <span className="min-w-0 truncate text-sm text-slate-200">{contact.fullName}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-400">Select at least two members. You are added automatically.</p>
        </div>
        <button type="submit" disabled={name.trim().length < 2 || memberIds.length < 2 || isCreating} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-medium text-white disabled:opacity-50">
          {isCreating ? <LoaderIcon className="size-4 animate-spin" /> : <UsersIcon className="size-4" />} Create group
        </button>
      </form>
    </div>
  );
}

export default CreateGroupModal;
