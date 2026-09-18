import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import CallModal from "../components/CallModal";
import CallPanel from "../components/CallPanel";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";

function ChatPage() {
  const {
    activeTab,
    selectedUser,
    selectedGroup,
  } = useChatStore();
  const {
    incomingCall,
    activeCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    toggleScreenShare,
    toggleFullscreen,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isSpeakerOff,
    isScreenSharing,
    isFullscreen,
    callDuration,
    status,
    setupSocketListeners,
    teardownSocketListeners,
    switchCamera,
  } = useCallStore();
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return undefined;
    setupSocketListeners();
    return () => {
      teardownSocketListeners();
      const callState = useCallStore.getState();
      if (callState.status !== "idle") callState.endCall("ended");
    };
  }, [socket, setupSocketListeners, teardownSocketListeners]);

  const connectionState = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <BorderAnimatedContainer className="h-full w-full max-w-7xl">
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950/55 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(7,12,24,0.94))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-44 w-44 rounded-full bg-cyan-400/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-52 w-52 rounded-full bg-indigo-500/[0.08] blur-[110px]" />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-nowrap overflow-hidden">
        <aside className={`${selectedUser || selectedGroup ? "hidden md:flex" : "flex"} h-full min-h-0 w-full shrink-0 flex-col border-b border-white/[0.08] bg-slate-950/40 backdrop-blur-2xl md:w-[320px] md:border-b-0 md:border-r lg:w-[360px]`}>
          <ProfileHeader />
          <div className="px-3 pb-2 pt-3">
            <ActiveTabSwitch />
          </div>
          <div className="premium-scrollbar flex-1 overflow-y-auto px-2 pb-3">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </aside>

        <main className={`${selectedUser || selectedGroup ? "flex" : "hidden md:flex"} h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.07),transparent_44%)]`}>
          {selectedUser || selectedGroup ? <ChatContainer /> : <NoConversationPlaceholder />}
        </main>
      </div>

      <CallModal call={incomingCall} onAccept={acceptCall} onReject={rejectCall} isIncoming />
      {activeCall && status === "outgoing" ? <CallModal call={activeCall} onCancel={() => endCall("ended")} /> : null}
      {activeCall && status !== "outgoing" ? (
        <CallPanel
          call={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onSwitchCamera={switchCamera}
          onToggleSpeaker={toggleSpeaker}
          onToggleScreenShare={toggleScreenShare}
          onToggleFullscreen={toggleFullscreen}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isSpeakerOff={isSpeakerOff}
          isScreenSharing={isScreenSharing}
          isFullscreen={isFullscreen}
          connectionState={connectionState}
          duration={new Date(callDuration * 1000).toISOString().slice(14, 19)}
        />
      ) : null}
    </div>
    </BorderAnimatedContainer>
  );
}
export default ChatPage;
