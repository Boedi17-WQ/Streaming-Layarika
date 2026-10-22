export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-36 w-full rounded-2xl bg-neutral-900/60 border border-neutral-800" />

      {/* KPI Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded bg-neutral-800" />
            <div className="h-8 w-16 rounded bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-4">
          <div className="h-5 w-36 rounded bg-neutral-800" />
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-neutral-800/60" />
            <div className="h-10 rounded-xl bg-neutral-800/60" />
            <div className="h-10 rounded-xl bg-neutral-800/60" />
          </div>
        </div>

        <div className="h-64 rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 space-y-4">
          <div className="h-5 w-36 rounded bg-neutral-800" />
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-neutral-800/60" />
            <div className="h-10 rounded-xl bg-neutral-800/60" />
            <div className="h-10 rounded-xl bg-neutral-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
