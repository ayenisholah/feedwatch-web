import { cn } from "@/lib/cn";

/**
 * Loading placeholders shaped like each page, so the layout doesn't jump when data arrives. They're
 * decorative: `DataState` wraps them in a busy status region that says "Loading feed data…".
 * The pulse stops for people who prefer reduced motion.
 */
export function Bone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded-sm bg-line motion-reduce:animate-none", className)}
    />
  );
}

function CardBones({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-md border border-line bg-surface p-5", className)}>{children}</div>;
}

function Rows({ count, columns }: { count: number; columns: number }) {
  return (
    <CardBones className="flex flex-col gap-4 p-0 py-2">
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="flex items-center gap-6 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: columns }, (_, col) => (
            <Bone key={col} className={cn("h-4", col === 0 ? "w-32" : "flex-1")} />
          ))}
        </div>
      ))}
    </CardBones>
  );
}

/** The overview: four stat tiles, the filter bar and table rows. */
export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardBones key={i} className="flex flex-col gap-3">
            <Bone className="h-4 w-28" />
            <Bone className="h-8 w-16" />
          </CardBones>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Bone className="h-10 w-80 rounded-pill" />
        <Bone className="h-10 w-48 rounded-pill" />
        <Bone className="ml-auto h-12 w-72 rounded-md" />
      </div>
      <Rows count={8} columns={6} />
    </div>
  );
}

/** A feed's detail: the facts card and two chart cards. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <CardBones className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className="h-3 w-24" />
            <Bone className="h-6 w-32" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </CardBones>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <CardBones key={i} className="flex flex-col gap-3">
            <Bone className="h-5 w-24" />
            <Bone className="h-3 w-3/4" />
            <Bone className="mt-2 h-48 w-full rounded-md" />
          </CardBones>
        ))}
      </div>
    </div>
  );
}

/** The compare table: one row per shared feed. */
export function CompareSkeleton() {
  return <Rows count={7} columns={5} />;
}

/** The incidents list: a summary line and incident cards. */
export function IncidentsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Bone className="h-4 w-56" />
      {Array.from({ length: 3 }, (_, i) => (
        <CardBones key={i} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Bone className="h-6 w-14 rounded-pill" />
            <Bone className="h-4 w-28" />
          </div>
          <Bone className="h-3 w-2/3" />
          <Bone className="h-4 w-1/2" />
        </CardBones>
      ))}
    </div>
  );
}
