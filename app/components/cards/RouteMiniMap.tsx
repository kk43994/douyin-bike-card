import { MapPin, ShieldAlert } from "lucide-react";
import type { RoutePlan } from "../../lib/amap-mock";

export function RouteMiniMap({ route, accent }: { route: RoutePlan; accent: string }) {
  return (
    <div
      className="pl-mid mt-3 relative h-[120px] overflow-hidden rounded-2xl border border-white/12 bg-black/35"
      style={{ willChange: "transform" }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(90deg, ${accent}22 1px, transparent 1px), linear-gradient(0deg, ${accent}22 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`grad-${route.routeId}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M 20 95 C 70 60, 100 95, 150 70 S 230 30, 280 60 S 360 90, 380 50"
          fill="none"
          stroke={`url(#grad-${route.routeId})`}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx="20" cy="95" r="6" fill={accent} />
        <circle cx="380" cy="50" r="6" fill="white" stroke={accent} strokeWidth="2" />
      </svg>
      <div className="absolute left-3 top-2 flex items-center gap-1 text-[10px] text-white/60">
        <MapPin size={12} />
        起点
      </div>
      <div className="absolute right-3 top-2 flex items-center gap-1 text-[10px] text-white/60">
        终点
        <ShieldAlert size={12} color={accent} />
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between rounded-md bg-black/40 px-2 py-1 text-[10px] text-white/65 backdrop-blur">
        <span>高德路径规划 · mock</span>
        <span style={{ color: accent }}>{route.distance_km.toFixed(1)} km</span>
      </div>
    </div>
  );
}
