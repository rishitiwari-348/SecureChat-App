import { LoaderIcon } from "lucide-react";
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-white/[0.08] bg-slate-950/40 px-8 py-8 shadow-soft backdrop-blur-xl">
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-3">
          <LoaderIcon className="size-8 animate-spin text-cyan-300" />
        </div>
        <p className="text-sm font-medium tracking-[0.24em] text-slate-400 uppercase">Loading workspace</p>
      </div>
    </div>
  );
}
export default PageLoader;
