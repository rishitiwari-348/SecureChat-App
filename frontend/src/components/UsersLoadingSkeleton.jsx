function UsersLoadingSkeleton() {
  return (
    <div className="space-y-2 px-1 py-1">
      {[1, 2, 3].map((item) => (
        <div key={item} className="shimmer-bg animate-shimmer rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-700/60" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-700/70" />
              <div className="h-3 w-1/2 rounded-full bg-slate-700/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;
