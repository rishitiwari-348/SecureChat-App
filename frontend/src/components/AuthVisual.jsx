import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react";

function AuthVisual({ eyebrow, title, description, bullets }) {
  return (
    <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(7,12,25,0.9))] p-7 shadow-[0_20px_60px_rgba(2,6,23,0.35)] sm:min-h-[420px] lg:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.10),transparent_40%,rgba(255,255,255,0.04))]" />
      <div className="absolute left-[-10%] top-[-15%] h-48 w-48 rounded-full bg-cyan-400/15 blur-[90px]" />
      <div className="absolute bottom-[-12%] right-[-8%] h-56 w-56 rounded-full bg-indigo-500/20 blur-[100px]" />
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-200">
          <SparklesIcon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <h3 className="mt-6 max-w-lg text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">{description}</p>
      </div>

      <div className="relative z-10 rounded-[1.5rem] border border-white/[0.08] bg-slate-950/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
        <svg viewBox="0 0 420 240" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <rect x="28" y="28" width="364" height="184" rx="30" fill="rgba(15,23,42,0.72)" stroke="rgba(255,255,255,0.08)" />
          <path d="M88 152C120 124 154 92 207 103C253 112 294 155 341 122" stroke="url(#meshGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M101 96C133 106 155 74 192 86C223 97 235 132 275 128C308 124 331 96 350 84" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <circle cx="88" cy="152" r="8" fill="#67e8f9" />
          <circle cx="207" cy="103" r="9" fill="#818cf8" />
          <circle cx="341" cy="122" r="8" fill="#c084fc" />
          <circle cx="275" cy="128" r="6" fill="#ffffff" fillOpacity="0.75" />
          <circle cx="154" cy="92" r="5" fill="#ffffff" fillOpacity="0.45" />
          <circle cx="228" cy="164" r="5" fill="#ffffff" fillOpacity="0.45" />
          <circle cx="320" cy="78" r="4" fill="#67e8f9" fillOpacity="0.8" />
        </svg>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2 sm:mt-6">
        {bullets.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-300">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-cyan-300" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AuthVisual;
