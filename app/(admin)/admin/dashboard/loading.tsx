function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-a-border/60 rounded ${className ?? ''}`} />
}

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 border border-a-border">
      <div className="flex items-start justify-between mb-5">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-lg p-6 border border-a-border">
        <Skeleton className="h-3 w-40 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg p-6 border border-a-border">
          <Skeleton className="h-3 w-36 mb-6" />
          <TableSkeleton rows={5} />
        </div>
        <div className="bg-white rounded-lg p-6 border border-a-border">
          <Skeleton className="h-3 w-36 mb-6" />
          <TableSkeleton rows={3} />
        </div>
      </div>
    </div>
  )
}
