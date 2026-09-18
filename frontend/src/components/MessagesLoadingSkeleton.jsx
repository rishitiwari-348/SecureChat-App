function MessagesLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-2 py-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className={`shimmer-bg h-16 animate-shimmer rounded-[1.25rem] border border-white/[0.07] bg-white/[0.035] ${index % 2 === 0 ? "w-32 rounded-bl-sm" : "w-40 rounded-br-sm"}`} />
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;
