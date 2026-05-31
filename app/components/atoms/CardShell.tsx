import type { ReactNode } from "react";

/**
 * 全部卡片统一外壳: 抖音风「黑色半透明」毛玻璃。
 * 半透明度偏低 (不突兀), 让底下的抖音视频隐约透出。
 * light 参数保留向后兼容, 但当前统一走深色半透明主题。
 */
export function CardShell({
  children,
  accent,
  poster,
}: {
  children: ReactNode;
  accent: string;
  light?: boolean;
  poster?: string;
}) {
  return (
    <div
      className="deck-card absolute inset-0 overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0d12]/60 shadow-[0_16px_44px_rgba(0,0,0,0.46)] backdrop-blur-2xl"
      style={{ willChange: "transform" }}
    >
      {poster && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5,7,10,0.15), rgba(5,7,10,0.78)), url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div
        className="pl-bg pointer-events-none absolute -inset-12 opacity-60"
        style={{
          background: `radial-gradient(circle at 28% 14%, ${accent}26, transparent 52%), radial-gradient(circle at 84% 92%, ${accent}1a, transparent 54%)`,
          willChange: "transform",
        }}
      />
      {/* 骑行海报肌理: 自行车线稿, 从右下角向左上径向渐隐溶入卡片 */}
      <svg
        className="pointer-events-none absolute -bottom-7 -right-5 h-[60%] w-auto"
        viewBox="0 0 240 150"
        fill="none"
        aria-hidden="true"
        style={{
          color: accent,
          opacity: 0.12,
          maskImage: "radial-gradient(120% 120% at 88% 90%, #000 0%, rgba(0,0,0,0.45) 42%, transparent 74%)",
          WebkitMaskImage: "radial-gradient(120% 120% at 88% 90%, #000 0%, rgba(0,0,0,0.45) 42%, transparent 74%)",
        }}
      >
        <path
          d="M-10 120 C 40 70, 70 130, 120 92 S 210 40, 250 64"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 10"
        />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="70" cy="104" r="30" />
          <circle cx="170" cy="104" r="30" />
          <path d="M70 104 L104 56 L150 56 M104 56 L120 104 L170 104 L138 58 L150 56 M120 104 L70 104" />
          <path d="M150 56 L158 48 M96 52 L112 52" />
        </g>
      </svg>
      {children}
    </div>
  );
}
