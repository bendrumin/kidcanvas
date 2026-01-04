export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-card rounded-xl border border-amber-100 dark:border-border p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-secondary rounded w-24" />
              <div className="h-8 bg-gray-200 dark:bg-secondary rounded w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-card rounded-xl border border-amber-100 dark:border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-secondary rounded w-48" />
          <div className="h-64 bg-gray-200 dark:bg-secondary rounded" />
        </div>
      </div>
    </div>
  )
}

