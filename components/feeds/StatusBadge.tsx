import { Badge } from "@/components/ui/Badge/Badge";
import { statusDisplay } from "@/lib/feeds";

/** A feed or incident status as a coloured pill: error, stale, drift or OK. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { tone, label } = statusDisplay(status);
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
