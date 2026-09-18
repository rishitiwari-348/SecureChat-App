import { Link } from "react-router";

function NotFoundPage() {
  return (
    <main className="relative z-10 flex min-h-[50vh] items-center justify-center px-6 py-16 text-center">
      <div className="rounded-[1.75rem] border border-white/[0.08] bg-slate-950/45 px-8 py-10 shadow-soft backdrop-blur-xl sm:px-12">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-100">Page not found</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">The page you requested does not exist, but the rest of the workspace is ready for you.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20">
          Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
