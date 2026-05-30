import type { ReactNode } from "react";

export function ControlChip({
  active,
  accent,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  accent: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition"
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
      {label}
    </button>
  );
}
