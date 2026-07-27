export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 skeleton rounded-full" />
          <div className="skeleton h-5 w-36" />
        </div>
        <div className="flex gap-5">
          <div className="text-center">
            <div className="skeleton h-6 w-10 mx-auto mb-1" />
            <div className="skeleton h-3 w-12 mx-auto" />
          </div>
          <div className="text-center">
            <div className="skeleton h-6 w-10 mx-auto mb-1" />
            <div className="skeleton h-3 w-12 mx-auto" />
          </div>
        </div>
      </div>

      {/* Map skeleton */}
      <div className="flex-1 skeleton rounded-none h-[70vh]" />

      {/* CTA skeleton */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <div className="skeleton h-14 w-full rounded-2xl" />
      </div>
    </div>
  )
}
