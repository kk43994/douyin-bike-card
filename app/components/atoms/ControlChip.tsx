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
  icon?: ReactNode;
  label: string;
  shortLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11.5px] font-semibold leading-none transition active:scale-[0.97]"
      aria-label={label}
      style={
        active
          ? {
              background: `${accent}24`,
              color: accent,
              borderColor: `${accent}66`,
              boxShadow: `0 0 16px ${accent}33`,
            }
          : {
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              borderColor: "rgba(255,255,255,0.12)",
            }
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel ?? label}</span>
    </button>
  );
}
