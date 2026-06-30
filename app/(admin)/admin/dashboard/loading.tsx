function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <Skeleton className="h-4 w-40 mb-6" />
          <TableSkeleton rows={5} />
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <Skeleton className="h-4 w-40 mb-6" />
          <TableSkeleton rows={3} />
        </div>
      </div>
    </div>
  )
}
