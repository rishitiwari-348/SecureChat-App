import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="relative flex h-[100dvh] min-h-0 items-center justify-center overflow-hidden bg-transparent p-0 sm:p-3 lg:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_24%),linear-gradient(135deg,#060816_0%,#080d17_45%,#0b1220_100%)]" />
      <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-nebula-500/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-[80px]" />

      <div className="relative z-10 flex h-full min-h-0 w-full items-stretch justify-center p-0 sm:p-2 lg:p-4">
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(15, 15, 25, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </div>
  );
}
export default App;
