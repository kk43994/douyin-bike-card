export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span>{label}</span>
    </div>
  );
}
