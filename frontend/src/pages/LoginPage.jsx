import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { EyeIcon, EyeOffIcon, GithubIcon, LoaderIcon, LockIcon, MailIcon, MessageCircleHeartIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import AuthVisual from "../components/AuthVisual";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, isLoggingIn, continueWithOAuth, oauthLoadingProvider, resetOAuthLoading } = useAuthStore();
  const isGoogleLoading = oauthLoadingProvider === "google";
  const isGithubLoading = oauthLoadingProvider === "github";
  const isAnyOAuthLoading = oauthLoadingProvider !== null;

  useEffect(() => {
    resetOAuthLoading();
    window.addEventListener("pageshow", resetOAuthLoading);
    return () => window.removeEventListener("pageshow", resetOAuthLoading);
  }, [resetOAuthLoading]);

  useEffect(() => {
    const verificationStatus = searchParams.get("emailVerification");
    const oauthError = searchParams.get("error");
    if (!verificationStatus && !oauthError) return;

    if (verificationStatus === "success") {
      toast.success("Email verified. You can now sign in.");
    } else if (verificationStatus) {
      toast.error("This verification link is invalid or has expired.");
    } else if (oauthError === "oauth_denied") {
      toast.error("OAuth sign-in was cancelled.");
    } else if (oauthError === "oauth_email_unverified") {
      toast.error("The provider did not return a verified email address.");
    } else {
      toast.error("OAuth sign-in could not be completed. Please try again.");
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  const handlePasswordKeyUp = (event) => {
    setCapsLockOn(event.getModifierState("CapsLock"));
  };

  return (
    <div className="flex w-full items-center justify-center px-3 py-4 sm:px-4 lg:px-6">
      <div className="relative w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-slate-950/40 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:rounded-[2.4rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.16),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(7,12,24,0.95))]" />
        <div className="absolute left-[-8%] top-[-12%] h-48 w-48 rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="absolute bottom-[-8%] right-[-6%] h-56 w-56 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative grid min-h-[780px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md animate-[fadeIn_250ms_ease-out]">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                  <MessageCircleHeartIcon className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-cyan-300">Secure Chat</p>
                  <p className="text-sm text-slate-400">Secure. Fast. Private.</p>
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">Welcome back</h1>
                <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-[15px]">Open your private workspace and continue your conversations with the calm clarity of a premium product.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="group relative">
                  <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                  <div className="relative rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3 py-3 transition-all duration-200 focus-within:border-cyan-400/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_40px_rgba(34,211,238,0.12)]">
                    <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors duration-200 group-focus-within:text-cyan-300" />
                    <input
                      id="login-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border-0 bg-transparent py-1 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      placeholder="name@company.com"
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <div className="relative rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3 py-3 transition-all duration-200 focus-within:border-cyan-400/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_40px_rgba(34,211,238,0.12)]">
                    <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors duration-200 group-focus-within:text-cyan-300" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onKeyUp={handlePasswordKeyUp}
                      className="w-full rounded-xl border-0 bg-transparent py-1 pl-10 pr-12 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-label="Password"
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-slate-100" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  {capsLockOn ? <p className="mt-2 flex items-center gap-2 text-xs text-amber-300"><ShieldCheckIcon className="h-3.5 w-3.5" /> Caps Lock is on</p> : null}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-white/5" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-cyan-300 transition-colors hover:text-cyan-200">Forgot password?</a>
                </div>

                <button className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/90 via-cyan-500/90 to-indigo-500/90 px-4 py-3.5 font-semibold text-white shadow-[0_16px_45px_rgba(34,211,238,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(34,211,238,0.28)] disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isLoggingIn}>
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  {isLoggingIn ? <LoaderIcon className="h-5 w-5 animate-spin" /> : <span className="relative flex items-center gap-2">Continue <SparklesIcon className="h-4 w-4" /></span>}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-500">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span>or continue with</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => continueWithOAuth("google")} disabled={isAnyOAuthLoading} aria-busy={isGoogleLoading} aria-label={isGoogleLoading ? "Connecting to Google" : "Continue with Google"} className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70">
                  {isGoogleLoading ? <LoaderIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <SparklesIcon className="h-4 w-4 text-cyan-300" />} {isGoogleLoading ? "Connecting…" : "Google"}
                </button>
                <button type="button" onClick={() => continueWithOAuth("github")} disabled={isAnyOAuthLoading} aria-busy={isGithubLoading} aria-label={isGithubLoading ? "Connecting to GitHub" : "Continue with GitHub"} className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70">
                  {isGithubLoading ? <LoaderIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GithubIcon className="h-4 w-4 text-slate-100" />} {isGithubLoading ? "Connecting…" : "GitHub"}
                </button>
              </div>

              <p className="mt-6 text-sm text-slate-400">
                New here? <Link to="/signup" className="font-medium text-cyan-300 transition-colors hover:text-cyan-200">Create an account</Link>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-white/[0.08] bg-slate-950/25 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="w-full max-w-xl animate-[fadeIn_260ms_ease-out]">
              <AuthVisual
                eyebrow="Private by design"
                title="A calmer way to connect."
                description="Move from idea to conversation with the confidence of a product built for focus, clarity, and speed."
                bullets={["Encrypted moments", "Fast handoff", "Live collaboration"]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
