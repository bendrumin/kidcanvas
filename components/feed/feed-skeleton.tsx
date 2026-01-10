export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
        >
          {/* Header skeleton */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>

          {/* Story skeleton */}
          <div className="px-4 pb-3 space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>

          {/* Image skeleton */}
          <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800" />

          {/* Footer skeleton */}
          <div className="px-4 pt-3 pb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
