import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCheckIcon, CheckIcon, PinIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageActionMenu from "./MessageActionMenu";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";

function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, messages, isMessagesLoading, subscribeToMessages,
    unsubscribeFromMessages, markMessagesSeen, reactToMessage, editMessage, deleteMessage, pinMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messagesContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const messageRefs = useRef(new Map());
  const pressTimerRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!selectedUser) return undefined;
    subscribeToMessages();
    let active = true;
    const markVisibleConversationSeen = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) markMessagesSeen(selectedUser._id);
    };
    const loadConversation = async () => {
      await getMessagesByUserId(selectedUser._id);
      if (active) markVisibleConversationSeen();
    };
    loadConversation();
    document.addEventListener("visibilitychange", markVisibleConversationSeen);
    window.addEventListener("focus", markVisibleConversationSeen);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", markVisibleConversationSeen);
      window.removeEventListener("focus", markVisibleConversationSeen);
      unsubscribeFromMessages();
    };
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markMessagesSeen]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  useEffect(() => {
    setOpenMenuId(null);
    setEditingId(null);
  }, [selectedUser]);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  const groupedMessages = useMemo(() => messages.reduce((groups, message) => {
    const key = new Date(message.createdAt).toDateString();
    const currentGroup = groups[groups.length - 1];
    if (!currentGroup || currentGroup.key !== key) {
      groups.push({
        key,
        label: new Date(message.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        messages: [message],
      });
    } else {
      currentGroup.messages.push(message);
    }
    return groups;
  }, []), [messages]);
  const pinnedMessage = messages.find((message) => message.pinned && !(message.deleted && message.deletedFor === "everyone"));

  const beginEdit = (message) => {
    setEditingId(message._id);
    setDraft(message.text || "");
  };

  const saveEdit = async (messageId) => {
    if (!draft.trim()) return;
    if (await editMessage(messageId, draft)) {
      setEditingId(null);
      setDraft("");
    }
  };

  const handleMessagePointerDown = (messageId, event) => {
    if (event.pointerType === "mouse") return;
    pressTimerRef.current = window.setTimeout(() => setOpenMenuId(messageId), 450);
  };
  const clearLongPress = () => window.clearTimeout(pressTimerRef.current);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden" data-testid="chat-container">
      <ChatHeader />
      {pinnedMessage ? (
        <button type="button" onClick={() => {
          const messagesContainer = messagesContainerRef.current;
          const pinnedElement = messageRefs.current.get(pinnedMessage._id);
          if (!messagesContainer || !pinnedElement) return;
          messagesContainer.scrollTo({
            top: pinnedElement.offsetTop - (messagesContainer.clientHeight / 2) + (pinnedElement.clientHeight / 2),
            behavior: "smooth",
          });
        }} className="z-[5] flex items-center gap-2 border-b border-cyan-400/10 bg-cyan-400/[0.06] px-5 py-2 text-left text-xs text-cyan-100 hover:bg-cyan-400/10">
          <PinIcon className="size-3.5 shrink-0" />
          <span className="truncate">{pinnedMessage.text || "Pinned attachment"}</span>
        </button>
      ) : null}
      <div ref={messagesContainerRef} className="premium-scrollbar relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 lg:px-6 lg:py-5" data-testid="message-list">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="mx-auto max-w-3xl space-y-5">
            {groupedMessages.map((group) => (
              <div key={group.key} className="space-y-2.5">
                <div className="flex items-center justify-center">
                  <span className="rounded-full border border-white/[0.08] bg-slate-950/60 px-3.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.24em] text-slate-400 shadow-[0_8px_24px_rgba(2,6,23,0.18)] backdrop-blur-xl">{group.label}</span>
                </div>
                {group.messages.map((msg) => {
                  const isSent = msg.senderId === authUser._id;
                  const isDeleted = msg.deleted && msg.deletedFor === "everyone";
                  const hasImage = Boolean(msg.image && !isDeleted);
                  const reactionGroups = Object.values((msg.reactions || []).reduce((groups, reaction) => {
                    const groupValue = groups[reaction.emoji] || { emoji: reaction.emoji, users: [] };
                    groupValue.users.push(reaction.userId);
                    groups[reaction.emoji] = groupValue;
                    return groups;
                  }, {}));

                  return (
                    <div
                      key={msg._id}
                      ref={(node) => node ? messageRefs.current.set(msg._id, node) : messageRefs.current.delete(msg._id)}
                      className={`message-row group flex animate-[fadeIn_180ms_ease-out] ${isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="relative max-w-[86%] sm:max-w-[72%]"
                        onPointerDown={(event) => handleMessagePointerDown(msg._id, event)}
                        onPointerUp={clearLongPress}
                        onPointerCancel={clearLongPress}
                        onClick={(event) => {
                          if (window.matchMedia("(hover: none)").matches && !event.target.closest("button, a, textarea, input, audio")) {
                            setOpenMenuId(msg._id);
                          }
                        }}
                        onContextMenu={(event) => { event.preventDefault(); setOpenMenuId(msg._id); }}
                      >
                        <MessageActionMenu
                          message={msg}
                          isOwn={isSent}
                          isOpen={openMenuId === msg._id}
                          onOpen={() => setOpenMenuId(msg._id)}
                          onClose={closeMenu}
                          onReact={(emoji) => reactToMessage(msg._id, emoji)}
                          onEdit={() => beginEdit(msg)}
                          onDelete={(scope) => deleteMessage(msg._id, scope)}
                          onPin={() => pinMessage(msg._id)}
                        />
                        <div className={`min-w-0 ${hasImage ? "rounded-2xl bg-transparent p-0 text-slate-100" : `rounded-[1.2rem] px-3.5 py-2.5 shadow-[0_12px_30px_rgba(2,6,23,0.26)] backdrop-blur-xl ${isSent ? "rounded-br-sm border border-cyan-300/10 bg-gradient-to-br from-cyan-500/90 via-cyan-600/90 to-indigo-500/90 text-white" : "rounded-bl-sm border border-white/[0.09] bg-white/[0.055] text-slate-100"}`}`}>
                          {msg.pinned ? <div className="mb-1 flex items-center gap-1 text-[10px] text-cyan-100/90"><PinIcon className="size-3" /> Pinned</div> : null}
                          {isDeleted ? <p className="text-sm italic text-slate-200/80">This message was deleted.</p> : (
                            <>
                              {msg.image ? <img src={msg.image} alt="Shared content" className="mb-1.5 max-h-64 min-w-48 max-w-full rounded-2xl border border-cyan-400/20 object-cover shadow-sm" /> : null}
                              {msg.attachment && msg.messageType !== "audio" ? <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="mb-1.5 block rounded-xl border border-white/[0.10] bg-slate-900/30 px-3 py-2"><p className="text-sm font-medium">{msg.attachment.fileName}</p><p className="text-[11px] text-slate-300/80">{Math.round(msg.attachment.size / 1024)} KB</p></a> : null}
                              {msg.metadata?.audioUrl ? <div className="mb-1.5 w-full min-w-0 max-w-full sm:min-w-56"><audio controls preload="metadata" className="h-10 w-full min-w-0 max-w-full" src={msg.metadata.audioUrl}>Your browser does not support voice-message playback.</audio><p className="mt-1 text-[10px] text-slate-300/80">Voice message · {msg.metadata.duration || 0}s</p></div> : null}
                              {editingId === msg._id ? (
                                <div className="min-w-[220px]">
                                  <textarea autoFocus rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setEditingId(null); setDraft(""); } else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); saveEdit(msg._id); } }} className="max-h-28 w-full resize-none rounded-lg border border-white/15 bg-slate-950/50 px-2.5 py-2 text-sm text-white outline-none focus:border-cyan-300/50" />
                                  <div className="mt-1.5 flex justify-end gap-2 text-xs"><button type="button" onClick={() => { setEditingId(null); setDraft(""); }} className="rounded-lg px-2 py-1 hover:bg-white/10">Cancel</button><button type="button" disabled={!draft.trim()} onClick={() => saveEdit(msg._id)} className="rounded-lg bg-cyan-400/20 px-2 py-1 text-cyan-50 disabled:opacity-50">Save</button></div>
                                </div>
                              ) : msg.text ? <p className="whitespace-pre-wrap break-words text-sm leading-5">{msg.text}</p> : null}
                            </>
                          )}
                          <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${isSent ? "text-cyan-50/80" : "text-slate-400"}`}>
                            {msg.edited && !isDeleted ? <span>Edited</span> : null}
                            <span>{new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                            {isSent ? msg.messageStatus === "seen" ? <span role="img" aria-label="Seen" title="Seen"><CheckCheckIcon className="size-3 text-cyan-200" /></span> : <span role="img" aria-label="Sent" title="Sent"><CheckIcon className="size-3 text-slate-200/80" /></span> : null}
                          </div>
                        </div>
                        {!isDeleted && reactionGroups.length ? (
                          <div className={`relative -mt-1.5 flex flex-wrap gap-1 px-2 ${isSent ? "justify-end" : "justify-start"}`}>
                            {reactionGroups.map(({ emoji, users }) => <button key={emoji} type="button" onClick={() => reactToMessage(msg._id, emoji)} className={`rounded-full border px-1.5 py-0.5 text-[11px] shadow-sm ${users.includes(authUser._id) ? "border-cyan-300/40 bg-cyan-400/20" : "border-white/10 bg-slate-900/90"}`} title={`${users.length} reaction${users.length === 1 ? "" : "s"}`}>{emoji}{users.length > 1 ? ` ${users.length}` : ""}</button>)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? <MessagesLoadingSkeleton /> : <NoChatHistoryPlaceholder name={selectedUser.fullName} />}
      </div>
      <MessageInput />
    </section>
  );
}

export default ChatContainer;
