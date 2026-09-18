function BorderAnimatedContainer({ children, className = "" }) {
  return (
    <div className={`neon-border-shell relative isolate min-h-0 overflow-hidden rounded-[2rem] border border-white/[0.06] bg-slate-950/70 shadow-[0_30px_90px_rgba(2,6,23,0.48)] sm:rounded-[2.4rem] ${className}`}>
      <div className="neon-border-orbit animate-nebula-border pointer-events-none absolute inset-0 z-[2] rounded-[inherit] opacity-100" aria-hidden="true" />
      <div className="relative z-[1] h-full min-h-0 w-full overflow-hidden rounded-[inherit]">{children}</div>
    </div>
  );
}
export default BorderAnimatedContainer;
