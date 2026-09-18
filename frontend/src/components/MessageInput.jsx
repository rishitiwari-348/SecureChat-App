import { useCallback, useEffect, useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, MicIcon, SendIcon, SmileIcon, XIcon } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const fileReaderRef = useRef(null);
  const imagePreviewUrlRef = useRef(null);
  const selectedImageFileRef = useRef(null);
  const imageSelectionIdRef = useRef(0);
  const textRevisionRef = useRef(0);
  const textareaRef = useRef(null);
  const audioPreviewUrlRef = useRef(null);
  const recordingHeartbeatRef = useRef(null);
  const recordingReceiverIdRef = useRef(null);
  const { sendMessage, isSoundEnabled, selectedUser, typingUsers, recordingUsers, voiceUploadProgress } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const isSelectedUserRecording = Boolean(Object.keys(recordingUsers[selectedUser?._id] || {}).length);

  const stopRecordingActivity = useCallback(() => {
    window.clearInterval(recordingHeartbeatRef.current);
    recordingHeartbeatRef.current = null;
    const receiverId = recordingReceiverIdRef.current;
    if (receiverId) socket?.emit("voice:recording:stop", { senderId: authUser?._id, receiverId, timestamp: Date.now() });
    recordingReceiverIdRef.current = null;
  }, [authUser?._id, socket]);

  const startRecordingActivity = useCallback(() => {
    if (!socket?.connected || !selectedUser?._id) return;
    stopRecordingActivity();
    recordingReceiverIdRef.current = selectedUser._id;
    const emitHeartbeat = () => socket.emit("voice:recording:start", {
      senderId: authUser?._id,
      receiverId: recordingReceiverIdRef.current,
      timestamp: Date.now(),
    });
    emitHeartbeat();
    recordingHeartbeatRef.current = window.setInterval(emitHeartbeat, 5000);
  }, [authUser?._id, selectedUser?._id, socket, stopRecordingActivity]);

  const clearImagePreview = useCallback(() => {
    imageSelectionIdRef.current += 1;
    if (fileReaderRef.current?.readyState === FileReader.LOADING) fileReaderRef.current.abort();
    fileReaderRef.current = null;
    if (imagePreviewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = null;
    selectedImageFileRef.current = null;
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    const timeout = setTimeout(() => {
      socket.emit("typing", { receiverId: selectedUser._id, senderId: authUser._id, isTyping: false });
    }, 800);

    if (text.trim()) {
      socket.emit("typing", { receiverId: selectedUser._id, senderId: authUser._id, isTyping: true });
    }

    return () => clearTimeout(timeout);
  }, [text, socket, selectedUser, authUser]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [text]);

  useEffect(() => {
    stopRecordingActivity();
    setShowVoiceRecorder(false);
    clearImagePreview();
  }, [clearImagePreview, selectedUser?._id, stopRecordingActivity]);

  useEffect(() => () => {
    if (fileReaderRef.current?.readyState === FileReader.LOADING) fileReaderRef.current.abort();
    if (imagePreviewUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(imagePreviewUrlRef.current);
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
    stopRecordingActivity();
  }, [stopRecordingActivity]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview && !audioPreview) || isSending) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    const pendingText = audioPreview ? "" : text.trim();
    const pendingImage = imagePreview;
    const pendingImageFile = selectedImageFileRef.current;
    const pendingImageSelectionId = imageSelectionIdRef.current;
    const pendingTextRevision = textRevisionRef.current;

    setIsSending(true);
    if (pendingImage) {
      setImagePreview(null);
      imagePreviewUrlRef.current = null;
      selectedImageFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (!audioPreview) setText("");
    }

    const sent = await sendMessage({
      text: pendingText,
      image: pendingImage,
      audio: audioPreview,
    });
    setIsSending(false);

    if (sent) {
      stopRecordingActivity();
      if (!audioPreview && !pendingImage && textRevisionRef.current === pendingTextRevision) setText("");
      if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
      audioPreviewUrlRef.current = null;
      setAudioPreview(null);
      socket?.emit("typing", { receiverId: selectedUser._id, senderId: authUser._id, isTyping: false });
    } else if (pendingImage && imageSelectionIdRef.current === pendingImageSelectionId) {
      imagePreviewUrlRef.current = pendingImage;
      selectedImageFileRef.current = pendingImageFile;
      setImagePreview(pendingImage);
      if (!audioPreview && pendingText) {
        setText((currentText) => currentText ? `${pendingText}\n${currentText}` : pendingText);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (fileReaderRef.current?.readyState === FileReader.LOADING) fileReaderRef.current.abort();
    const selectionId = imageSelectionIdRef.current + 1;
    imageSelectionIdRef.current = selectionId;
    selectedImageFileRef.current = file;
    const reader = new FileReader();
    fileReaderRef.current = reader;
    reader.onloadend = () => {
      if (!reader.result || fileReaderRef.current !== reader || imageSelectionIdRef.current !== selectionId) return;
      imagePreviewUrlRef.current = reader.result;
      setImagePreview(reader.result);
      fileReaderRef.current = null;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    clearImagePreview();
  };

  const handleEmojiSelect = (emoji) => {
    textRevisionRef.current += 1;
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleVoiceComplete = ({ blob, duration, mimeType }) => {
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
    const previewUrl = URL.createObjectURL(blob);
    audioPreviewUrlRef.current = previewUrl;
    setAudioPreview({ blob, duration, mimeType, previewUrl });
    setShowVoiceRecorder(false);
  };

  const removeAudio = () => {
    if (audioPreviewUrlRef.current) URL.revokeObjectURL(audioPreviewUrlRef.current);
    audioPreviewUrlRef.current = null;
    setAudioPreview(null);
  };

  return (
    <div className="shrink-0 border-t border-white/[0.08] bg-slate-950/45 px-3 py-3.5 backdrop-blur-2xl sm:px-5 lg:px-6" data-testid="message-composer">
      {showVoiceRecorder ? <VoiceRecorder onComplete={handleVoiceComplete} onCancel={() => setShowVoiceRecorder(false)} onRecordingStart={startRecordingActivity} onRecordingStop={stopRecordingActivity} /> : null}

      {imagePreview && (
        <div className="mx-auto mb-3 flex max-w-3xl items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
            <button
              onClick={removeImage}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/90 text-slate-100 transition-colors hover:bg-slate-800"
              type="button"
              aria-label="Remove attachment"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {audioPreview ? (
        <div className="mx-auto mb-3 flex max-w-2xl items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2">
          <audio controls preload="metadata" className="h-9 min-w-0 flex-1" src={audioPreview.previewUrl} />
          <span className="text-xs text-slate-400">{audioPreview.duration}s</span>
          {voiceUploadProgress !== null ? <span className="text-xs text-cyan-300" aria-live="polite">{voiceUploadProgress}%</span> : null}
          <button type="button" onClick={removeAudio} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Remove voice recording"><XIcon className="size-4" /></button>
        </div>
      ) : null}

      {isSelectedUserRecording ? (
        <p className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-sm text-cyan-300" role="status" aria-live="polite" aria-label={`${selectedUser?.fullName} is recording a voice message`}>
          <MicIcon className="size-4 animate-pulse" aria-hidden="true" />
          <span>{selectedUser?.fullName} is recording a voice message…</span>
          <span className="flex items-center gap-0.5" aria-hidden="true"><span className="size-1 animate-pulse rounded-full bg-cyan-300" /><span className="size-1 animate-pulse rounded-full bg-cyan-300 [animation-delay:150ms]" /><span className="size-1 animate-pulse rounded-full bg-cyan-300 [animation-delay:300ms]" /></span>
        </p>
      ) : typingUsers[selectedUser?._id] ? <p className="mx-auto mb-2 flex max-w-3xl text-sm text-cyan-300">{selectedUser?.fullName} is typing...</p> : null}

      <form onSubmit={handleSendMessage} className="mx-auto flex max-w-3xl items-center gap-1.5 sm:gap-2">
        <div className="group flex min-w-0 flex-1 items-center rounded-2xl border border-white/[0.09] bg-white/[0.045] px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_32px_rgba(2,6,23,0.18)] backdrop-blur-xl transition-all duration-200 focus-within:border-cyan-400/35 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_14px_38px_rgba(34,211,238,0.08)]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              textRevisionRef.current += 1;
              setText(e.target.value);
              if (isSoundEnabled) playRandomKeyStrokeSound();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
            className="premium-scrollbar max-h-28 min-h-9 w-full resize-none overflow-y-auto bg-transparent px-1.5 py-2 text-sm leading-5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
            placeholder="Type your message..."
            aria-label="Message composer"
          />
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        <div className="relative">
          <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)} className="chat-icon-button size-10 rounded-xl" aria-label="Choose emoji">
            <SmileIcon className="h-5 w-5" />
          </button>
          {showEmojiPicker ? <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} /> : null}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`chat-icon-button size-10 rounded-xl ${imagePreview ? "border-cyan-400/30 text-cyan-200" : ""}`}
          aria-label="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <button type="button" onClick={() => setShowVoiceRecorder((prev) => !prev)} className="chat-icon-button size-10 rounded-xl" aria-label="Record voice message">
          <MicIcon className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !imagePreview && !audioPreview)}
          className="group flex size-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400 via-cyan-500 to-indigo-500 text-white shadow-[0_10px_28px_rgba(34,211,238,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_14px_34px_rgba(34,211,238,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          aria-label="Send message"
        >
          <SendIcon className={`h-5 w-5 ${isSending ? "animate-pulse" : ""}`} />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
