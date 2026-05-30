import dynamic from "next/dynamic";
import { Cloud, MapPin, Mic, MicOff, Navigation, Pencil, RefreshCw } from "lucide-react";
import { CardShell } from "../atoms/CardShell";
import { MetricBig } from "../atoms/MetricBig";
import { SegmentDot } from "../atoms/SegmentDot";
import type { AmapBicyclingResult } from "../../lib/amap";
import type { LatLng } from "../../lib/geo";
import type { RouteCardProps } from "./card-types";

const hasJsKey = typeof process !== "undefined" && !!process.env.NEXT_PUBLIC_AMAP_JS_KEY;

const RealAmap = dynamic(() => import("./RealAmap").then((m) => m.RealAmap), {
  ssr: false,
  loading: () => (
    <div className="pl-mid mt-3 relative h-[220px] overflow-hidden rounded-2xl border border-white/12 bg-black/35" style={{ willChange: "transform" }}>
      <div className="absolute inset-0 grid place-items-center text-[11px] text-white/55">
        <span className="inline-flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin" />
          高德地图加载中…
        </span>
      </div>
    </div>
  ),
});

export function RouteCard({
  profile,
  scanResult,
  origin,
  destination,
  customRoute,
  routeSource,
  weather,
  voicePlaying,
  voiceStepIdx,
  onPickDestination,
  onNav,
  onVoiceNav,
  onReset,
  myPosition,
  myBearing,
  navProgress,
}: RouteCardProps) {
  const confidence = scanResult?.confidence ?? null;
  return (
    <CardShell accent={profile.accent}>
      <div className="absolute inset-0 overflow-y-auto p-4">
        <div className="pl-mid flex items-center justify-between" style={{ willChange: "transform" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              卡 1 · 智能路线推荐
            </p>
            <p className="mt-1 text-[11px] text-white/60">
              <span
                className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: confidence ? "#4ade80" : "#94a3b8" }}
              />
              {scanResult
                ? `自动识别完成 · ${profile.label} · 置信度 ${confidence}%`
                : "等待场景识别"}
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-white/65 hover:bg-white/10"
          >
            重新识别
          </button>
        </div>

        <button
          type="button"
          onClick={onPickDestination}
          className="pl-mid mt-3 flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-left hover:bg-white/[0.09]"
          style={{ willChange: "transform" }}
        >
          <MapPin size={16} color={profile.accent} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">目的地</p>
            <p className="truncate text-sm font-semibold text-white">
              {destination ? destination.name : "未指定 · 点击搜索"}
            </p>
            {destination?.hint && (
              <p className="truncate text-[11px] text-white/55">{destination.hint}</p>
            )}
          </div>
          <Pencil size={14} className="text-white/55" />
        </button>

        {!destination && (
          <div className="pl-mid mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center" style={{ willChange: "transform" }}>
            <p className="text-sm font-semibold text-white/82">点上方搜索一个目的地</p>
            <p className="mt-1 text-[11px] text-white/45">
              支持高德地图所有 POI 实时搜索 · 自动为你规划骑行路线
            </p>
          </div>
        )}

        {destination && customRoute && (
          <>
            <div className="pl-mid mt-3" style={{ willChange: "transform" }}>
              <h3 className="text-[24px] font-bold leading-tight">{destination.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: routeSource === "amap" ? "#4ade80" : "#f5a524",
                    boxShadow: `0 0 8px ${
                      routeSource === "amap" ? "#4ade80" : "#f5a524"
                    }66`,
                  }}
                />
                {routeSource === "amap"
                  ? "高德实时规划"
                  : "高德调用失败 · 仅显示直线"}{" "}
                · 共 {customRoute.steps.length} 段
              </p>
            </div>

            <div className="pl-mid mt-3 grid grid-cols-3 gap-2" style={{ willChange: "transform" }}>
              <MetricBig
                value={(customRoute.distance_m / 1000).toFixed(1)}
                unit="km"
                label="距离"
                accent={profile.accent}
              />
              <MetricBig
                value={String(Math.max(1, Math.round(customRoute.duration_s / 60)))}
                unit="min"
                label="时长"
                accent={profile.accent}
              />
              <MetricBig
                value={weather ? weather.temperature : "—"}
                unit={weather ? "°C" : ""}
                label={weather ? weather.weather : "天气"}
                accent={profile.accent}
              />
            </div>

            {hasJsKey ? (
              <RealAmap
                origin={origin}
                destination={destination.loc}
                polyline={customRoute.polyline}
                accent={profile.accent}
                myPosition={myPosition}
                myBearing={myBearing}
                navProgress={navProgress}
                fallback={
                  <StaticRouteMap
                    origin={origin}
                    destination={destination.loc}
                    route={customRoute}
                    accent={profile.accent}
                  />
                }
              />
            ) : (
              <StaticRouteMap
                origin={origin}
                destination={destination.loc}
                route={customRoute}
                accent={profile.accent}
              />
            )}

            {weather && (
              <div className="pl-mid mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px]" style={{ willChange: "transform" }}>
                <Cloud size={14} color={profile.accent} />
                <span className="text-white/82">
                  {weather.city} · {weather.weather} · {weather.temperature}°C ·{" "}
                  {weather.winddirection}风 {weather.windpower} 级 · 湿度 {weather.humidity}%
                </span>
              </div>
            )}

            <div className="pl-mid mt-3 space-y-1.5" style={{ willChange: "transform" }}>
              <p className="text-[11px] font-semibold text-white/55">路段提示</p>
              <div className="space-y-1">
                {customRoute.steps.slice(0, 8).map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl border px-3 py-2 text-[12px]"
                    style={
                      voiceStepIdx === idx
                        ? {
                            borderColor: profile.accent,
                            background: `${profile.accent}1f`,
                            boxShadow: `0 0 0 1px ${profile.accent}55, 0 0 16px ${profile.accent}33`,
                          }
                        : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    <SegmentDot status="clear" />
                    <span className="flex-1 text-white/82">{s.instruction}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{s.distance_m}m</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pl-fg mt-4 flex gap-2" style={{ willChange: "transform" }}>
              <button
                type="button"
                onClick={onNav}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold text-black"
                style={{ background: profile.accent, boxShadow: `0 6px 20px ${profile.accentSoft}` }}
              >
                <Navigation size={16} />
                开始导航
              </button>
              <button
                type="button"
                onClick={onVoiceNav}
                className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                {voicePlaying ? <MicOff size={16} /> : <Mic size={16} />}
                {voicePlaying ? "停止播报" : "语音导航"}
              </button>
            </div>
          </>
        )}

        {destination && !customRoute && (
          <div className="pl-mid mt-3 rounded-2xl border border-dashed border-white/15 bg-black/30 p-4 text-center text-[12px] text-white/65" style={{ willChange: "transform" }}>
            <p className="font-semibold text-white">正在为你规划路线…</p>
            <p className="mt-1 text-[11px] text-white/45">高德实时调用 · 通常 &lt; 2s</p>
          </div>
        )}

        <p
          className="pl-fg mt-3 text-center text-[10px] text-white/40"
          style={{ willChange: "transform" }}
        >
          ← 滑动切换 · 卡 2 附近骑友雷达
        </p>
      </div>
    </CardShell>
  );
}

function StaticRouteMap({
  origin,
  destination,
  route,
  accent,
}: {
  origin: LatLng | null;
  destination: LatLng;
  route: AmapBicyclingResult;
  accent: string;
}) {
  const points = normalizeRoutePoints(route.polyline.length >= 2 ? route.polyline : [origin, destination]);
  const path = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const start = points[0] ?? { x: 24, y: 150 };
  const end = points[points.length - 1] ?? { x: 320, y: 44 };

  return (
    <div
      className="pl-mid mt-3 relative h-[200px] overflow-hidden rounded-2xl border border-white/12 bg-black/35"
      style={{ willChange: "transform" }}
    >
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `linear-gradient(90deg, ${accent}22 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.14) 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }}
      />
      <svg viewBox="0 0 360 200" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 0 162 C 70 118, 112 168, 168 106 S 260 48, 360 74"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#route-glow)"
        />
        <circle cx={start.x} cy={start.y} r="6" fill={accent} />
        <circle cx={end.x} cy={end.y} r="7" fill="#fff" stroke={accent} strokeWidth="3" />
      </svg>
      <div className="absolute left-3 top-2 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white/65 backdrop-blur">
        实时路线预览
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between rounded-xl bg-black/50 px-3 py-2 text-[11px] text-white/65 backdrop-blur">
        <span>起点 → 目的地</span>
        <span style={{ color: accent }}>{(route.distance_m / 1000).toFixed(1)} km</span>
      </div>
    </div>
  );
}

function normalizeRoutePoints(raw: Array<LatLng | null>): Array<{ x: number; y: number }> {
  const valid = raw.filter((p): p is LatLng => !!p && Number.isFinite(p.lng) && Number.isFinite(p.lat));
  if (valid.length < 2) {
    return [
      { x: 34, y: 158 },
      { x: 122, y: 96 },
      { x: 326, y: 52 },
    ];
  }
  const minLng = Math.min(...valid.map((p) => p.lng));
  const maxLng = Math.max(...valid.map((p) => p.lng));
  const minLat = Math.min(...valid.map((p) => p.lat));
  const maxLat = Math.max(...valid.map((p) => p.lat));
  const lngSpan = maxLng - minLng || 0.01;
  const latSpan = maxLat - minLat || 0.01;
  return valid.map((p) => ({
    x: 28 + ((p.lng - minLng) / lngSpan) * 304,
    y: 168 - ((p.lat - minLat) / latSpan) * 136,
  }));
}
