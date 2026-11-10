export default function CatalogoLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Skeleton */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="h-3 w-28 bg-surface-soft rounded-full mx-auto animate-pulse" />
          <div className="h-8 w-64 bg-surface-soft rounded-md mx-auto animate-pulse" />
          <div className="h-4 w-80 bg-surface-soft rounded-md mx-auto animate-pulse" />
        </div>

        {/* Search & Tabs Skeleton */}
        <div className="max-w-xl mx-auto mb-8 space-y-4">
          <div className="h-11 bg-surface-soft rounded-lg animate-pulse" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-surface-soft rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-surface/50 rounded-lg p-3 space-y-3 border border-border/50">
              <div className="aspect-[3/4] bg-surface-soft rounded-md animate-pulse" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 bg-surface-soft rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-surface-soft rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-surface-soft rounded animate-pulse pt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

