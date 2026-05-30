import type { ReactNode } from "react";

export function ControlChip({
  active,
  accent,
  icon,
  label,
  shortLabel,
  onClick,
}: {
  active: boolean;
  accent: string;
  icon: ReactNode;
  label: string;
  shortLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition"
      aria-label={label}
      style={
        active
          ? {
              background: `${accent}26`,
              color: accent,
              boxShadow: `0 0 0 1px ${accent}55, 0 0 18px ${accent}33`,
            }
          : { color: "rgba(255,255,255,0.72)" }
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel ?? label}</span>
    </button>
  );
}
