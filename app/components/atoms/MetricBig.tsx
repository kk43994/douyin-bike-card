export function MetricBig({
  value,
  unit,
  label,
  accent,
}: {
  value: string;
  unit: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[28px] font-black leading-none" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-[11px] text-white/55">{unit}</span>
      </div>
    </div>
  );
}
