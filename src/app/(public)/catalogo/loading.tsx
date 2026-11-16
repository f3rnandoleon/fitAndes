export default function CatalogoLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10 space-y-6 lg:space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-3 w-36 bg-surface-soft rounded-full animate-pulse" />

        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-32 shrink-0 bg-surface-soft rounded-full animate-pulse" />
          ))}
        </div>

        {/* Main Grid Matching CatalogoPage */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          <div className="hidden lg:block space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-6 h-32 animate-pulse" />
            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-6 h-96 animate-pulse" />
          </div>

          <div className="space-y-6">
            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-5 h-24 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white animate-pulse">
                  <div className="aspect-[3/4] bg-surface-soft" />
                  <div className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="h-3 w-1/3 rounded bg-surface" />
                    <div className="h-4 w-3/4 rounded bg-surface" />
                    <div className="h-6 w-1/2 rounded bg-surface" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
