import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert/Alert";
import { Button } from "@/components/ui/Button/Button";
import { formatAgo } from "@/lib/format";
import type { ApiState } from "@/lib/api/use-api";
import { Bone } from "./Skeleton";

/**
 * The loading and error parts every page shares. While loading it shows the page's skeleton (or a
 * plain placeholder) inside a busy status region that screen readers announce; on an error with
 * no data, an alert with Retry; on an error after earlier data, a warning above that data. Data
 * and empty states are the page's own, rendered through `children` / `empty`.
 */
export function DataState<T>({
  result,
  retry,
  nowMs,
  empty,
  loading,
  children,
}: {
  result: ApiState<T>;
  retry: () => void;
  nowMs: number;
  empty: ReactNode;
  /** A placeholder shaped like the page (components/feeds/Skeleton.tsx). */
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (result.state === "loading") {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading feed data…</span>
        {loading ?? <Bone className="h-64 w-full rounded-md" />}
      </div>
    );
  }
  const retryButton = (
    <Button variant="ghost" size="sm" onClick={retry} className="mt-3">
      Try again
    </Button>
  );
  if (result.state === "error" && result.data === undefined) {
    return (
      <Alert tone="danger" title="Couldn't load feed data">
        <p>{result.error.message}</p>
        {retryButton}
      </Alert>
    );
  }
  return (
    <>
      {result.state === "error" && (
        <Alert tone="warning" title="Couldn't refresh" className="mb-4">
          <p>
            {result.error.message} Showing data from {formatAgo((result.refreshedAt ?? nowMs) / 1000, nowMs)}.
          </p>
          {retryButton}
        </Alert>
      )}
      {result.state === "empty" ? empty : children(result.data as T)}
    </>
  );
}
