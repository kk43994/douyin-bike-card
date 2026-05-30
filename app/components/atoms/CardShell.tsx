import type { ReactNode } from "react";

export function CardShell({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <div
      className="deck-card absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-[#0a0c12]/90 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
      style={{ willChange: "transform" }}
    >
      <div
        className="pl-bg pointer-events-none absolute -inset-12 opacity-70"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${accent}33, transparent 55%), radial-gradient(circle at 80% 90%, ${accent}22, transparent 55%)`,
          willChange: "transform",
        }}
      />
      {children}
    </div>
  );
}
