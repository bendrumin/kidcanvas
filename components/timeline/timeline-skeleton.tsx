export function TimelineSkeleton() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-amber-100 dark:border-border p-8">
      <div className="animate-pulse space-y-8">
        {/* Filter skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 dark:bg-secondary rounded-lg w-48" />
          <div className="h-10 bg-gray-200 dark:bg-secondary rounded-lg w-48" />
        </div>
        
        {/* Timeline skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-secondary rounded w-32" />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div
                    key={j}
                    className="aspect-square bg-gray-200 dark:bg-secondary rounded-lg"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

