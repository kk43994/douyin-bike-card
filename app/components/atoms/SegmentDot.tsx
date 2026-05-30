export type SegmentStatus = "clear" | "mild" | "heavy";

export function SegmentDot({ status }: { status: SegmentStatus }) {
  const color = status === "clear" ? "#4ade80" : status === "mild" ? "#f5a524" : "#f87171";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
    />
  );
}
