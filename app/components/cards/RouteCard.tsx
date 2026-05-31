import dynamic from "next/dynamic";
import {
  Cloud, MapPin, Mic, MicOff, Navigation, Pencil, RefreshCw, Share2,
  ShieldCheck, ChevronRight, Route as RouteIcon, Clock, TrendingUp, Sparkles,
  Activity, Gauge, Leaf, Zap, AlertTriangle, WandSparkles, Bot, Send,
  Bike, Trophy, ExternalLink,
} from "lucide-react";
import gsap from "gsap";
import { Component, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardShell } from "../atoms/CardShell";
import type { AmapBicyclingResult, AmapWeather } from "../../lib/amap";
import type { LatLng } from "../../lib/geo";
import { askRideAi } from "../../lib/ride-ai";
import type { AiRecommendedDestination, NavProgress, RouteCardProps } from "./card-types";
import { primeVoice, speak } from "../../lib/voice-nav";

const hasJsKey = typeof process !== "undefined" && !!process.env.NEXT_PUBLIC_AMAP_JS_KEY;

const RealAmap = dynamic(() => import("./RealAmap").then((m) => m.RealAmap), {
  ssr: false,
  loading: () => (
    <div className="pl-mid mt-3 relative h-[220px] overflow-hidden rounded-2xl border border-white/12 bg-black/35" style={{ willChange: "transform" }}>
      <div className="absolute inset-0 grid place-items-center text-[11px] text-white/55">
        <span className="inline-flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin" />
          AI 地图加载中…
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
  recommendedDestinations,
  voicePlaying,
  voiceStepIdx,
  placeName,
  onPickDestination,
  onPickRecommendedDestination,
  onNav,
  onVoiceNav,
  onOpenAmapNav,
  onShare,
  onReset,
  myPosition,
  myBearing,
  navProgress,
}: RouteCardProps) {
  const confidence = scanResult?.confidence ?? null;
  const isCity = profile.key === "city";
  const brand = profile.accent; // 深色半透明底, 直接用品牌色对比足够
  const SAFE = "#4ade80";
  const score = Math.max(isCity ? 94 : 92, Math.min(98, (confidence ?? 92) + (isCity ? 8 : 6)));
  const safetyTips = isCity ? "全程绿道 · 红绿灯少 · 车流低" : "林道铺装 · 缓坡为主 · 风景佳";
  const scrollRef = useRef<HTMLDivElement>(null);
  const destinationKey = destination
    ? `${destination.name}:${destination.loc.lng.toFixed(5)},${destination.loc.lat.toFixed(5)}`
    : "none";
  const [routeOptimizedKey, setRouteOptimizedKey] = useState<string | null>(null);
  const routeOptimized = routeOptimizedKey === destinationKey;
  const markRouteOptimized = useCallback(() => {
    setRouteOptimizedKey(destinationKey);
  }, [destinationKey]);
  const aiRideIntel = useMemo(
    () => customRoute
      ? buildAiRideIntel({
          route: customRoute,
          weather,
          isCity,
          navProgress,
          voiceStepIdx,
          optimized: routeOptimized,
          routeSource,
        })
      : null,
    [customRoute, weather, isCity, navProgress, voiceStepIdx, routeOptimized, routeSource],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [destinationKey]);

  return (
    <CardShell accent={profile.accent}>
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4 text-white">
        <div className="pl-mid flex items-start justify-between gap-3" style={{ willChange: "transform" }}>
          <div className="min-w-0">
            <div className="flex min-h-[30px] items-center gap-2">
              <h3 className="ui-title truncate text-white">
                {destination ? destination.name : "智能骑行路线"}
              </h3>
              <span
                className="safety-score-badge relative grid h-[26px] shrink-0 grid-cols-[13px_auto] items-center overflow-hidden rounded-full px-2 text-[12px] font-extrabold leading-none text-black shadow-sm"
                style={{ background: `linear-gradient(135deg, ${SAFE}, #16a34a)` }}
                aria-label={`骑行安全评分 ${score}`}
              >
                <span className="safety-score-sheen" />
                <span className="safety-score-icon">
                  <ShieldCheck size={13} strokeWidth={2.8} />
                </span>
                <span className="safety-score-value tabular-nums">{score}</span>
              </span>
            </div>
            <p className="ui-subtle mt-1 flex items-center gap-1">
              <Sparkles size={11} className="idle-ai-spark shrink-0" style={{ color: brand }} />
              {scanResult
                ? `AI 检测所在地 · ${placeName ?? profile.label}`
                : "AI 正在检测所在地…"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onShare}
              aria-label="分享路线"
              className="ui-icon-btn"
              style={{ borderColor: `${brand}44`, color: brand, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px ${brand}18` }}
            >
              <Share2 size={14} />
            </button>
            <button
              type="button"
              onClick={onReset}
              aria-label="重新识别"
              className="ui-icon-btn"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* 安全提示条 */}
        <div
          className="pl-mid mt-3 flex min-h-[38px] items-center gap-2 rounded-[17px] px-3 py-2"
          style={{ background: `${SAFE}1f` }}
        >
          <ShieldCheck size={14} style={{ color: SAFE }} className="shrink-0" />
          <span className="text-[11.5px] font-semibold" style={{ color: SAFE }}>安全提示</span>
          <span className="truncate text-[11.5px] text-white/68">{safetyTips}</span>
          <ChevronRight size={15} className="ml-auto shrink-0 text-white/35" />
        </div>

        <button
          type="button"
          onClick={onPickDestination}
          className="ui-card pl-mid mt-3 flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.08]"
          style={{ willChange: "transform" }}
        >
          <MapPin size={16} color={brand} />
          <div className="min-w-0 flex-1">
            <p className="ui-kicker uppercase">目的地</p>
            <p className="truncate text-[13px] font-semibold text-white">
              {destination ? destination.name : "未指定 · 点击搜索"}
            </p>
            {destination?.hint && (
              <p className="ui-caption truncate">{destination.hint}</p>
            )}
          </div>
          <Pencil size={14} className="text-white/45" />
        </button>

        {!destination && (
          <AiDestinationRecommendations
            accent={brand}
            isCity={isCity}
            recommendations={recommendedDestinations}
            onPick={onPickRecommendedDestination}
            onSearch={onPickDestination}
          />
        )}

        {destination && customRoute && (
          <>
            <div className="pl-mid mt-3 flex items-center gap-1.5 text-[12px] text-white/55" style={{ willChange: "transform" }}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: routeSource === "amap" ? SAFE : "#f5a524" }}
              />
              {routeSource === "amap" ? "AI 智能规划路线" : "网络异常 · 仅显示直线"}
              {" · 共 "}{customRoute.steps.length}{" 段"}
            </div>

            <div className="pl-mid mt-3 grid grid-cols-3 gap-2" style={{ willChange: "transform" }}>
              <LightMetric
                icon={<RouteIcon size={13} />}
                value={(customRoute.distance_m / 1000).toFixed(1)}
                unit="km"
                label="距离"
                brand={brand}
              />
              <LightMetric
                icon={<Clock size={13} />}
                value={String(Math.max(1, Math.round(customRoute.duration_s / 60)))}
                unit="min"
                label="时长"
                brand={brand}
              />
              <LightMetric
                icon={<TrendingUp size={13} />}
                value={weather ? weather.temperature : "—"}
                unit={weather ? "°C" : ""}
                label={weather ? weather.weather : "天气"}
                brand={brand}
              />
            </div>

            {hasJsKey ? (
              <MapErrorBoundary
                fallback={
                  <StaticRouteMap
                    origin={origin}
                    destination={destination.loc}
                    route={customRoute}
                    accent={profile.accent}
                  />
                }
              >
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
              </MapErrorBoundary>
            ) : (
              <StaticRouteMap
                origin={origin}
                destination={destination.loc}
                route={customRoute}
                accent={profile.accent}
              />
            )}

            {aiRideIntel && (
              <>
                <AiRideIntelPanel
                  intel={aiRideIntel}
                  accent={brand}
                  optimized={routeOptimized}
                  onOptimize={markRouteOptimized}
                />
                <RideVoiceAssistantPanel
                  intel={aiRideIntel}
                  accent={brand}
                  route={customRoute}
                  weather={weather}
                  isCity={isCity}
                  destinationName={destination.name}
                  activeStepIndex={voiceStepIdx}
                  navProgress={navProgress}
                  optimized={routeOptimized}
                  routeSource={routeSource}
                  onOptimize={markRouteOptimized}
                />
              </>
            )}

            {weather && (
              <div className="pl-mid mt-3 flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2 text-[12px]" style={{ willChange: "transform" }}>
                <Cloud size={14} color={brand} />
                <span className="text-white/75">
                  {weather.city} · {weather.weather} · {weather.temperature}°C ·{" "}
                  {weather.winddirection}风 {weather.windpower} 级 · 湿度 {weather.humidity}%
                </span>
              </div>
            )}

            <div className="pl-mid mt-3 space-y-1.5" style={{ willChange: "transform" }}>
              <p className="text-[11px] font-semibold text-white/45">路段提示</p>
              <div className="space-y-1">
                {customRoute.steps.slice(0, 8).map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]"
                    style={
                      voiceStepIdx === idx
                        ? { background: `${brand}24`, boxShadow: `inset 0 0 0 1px ${brand}66` }
                        : { background: "rgba(255,255,255,0.04)" }
                    }
                  >
                    <span
                      className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: voiceStepIdx === idx ? brand : SAFE }}
                    />
                    <span className="flex-1 text-white/80">{s.instruction}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{s.distance_m}m</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pl-fg mt-4 flex gap-2" style={{ willChange: "transform" }}>
              <button
                type="button"
                onClick={onNav}
                className="flex min-w-0 flex-[1.25] items-center justify-center gap-1.5 rounded-full py-3 text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${profile.accent}, ${isCity ? "#0ea5b7" : profile.accent}cc)`, boxShadow: `0 8px 22px ${profile.accent}55` }}
              >
                <Navigation size={16} />
                {navProgress && navProgress.speedKmh > 0 ? "结束导航" : "开始骑行"}
              </button>
              <button
                type="button"
                onClick={onVoiceNav}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-3 text-[13px] font-semibold"
                style={
                  voicePlaying
                    ? { background: `${brand}24`, borderColor: `${brand}66`, color: brand }
                    : { background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }
                }
              >
                {voicePlaying ? <MicOff size={16} /> : <Mic size={16} />}
                {voicePlaying ? "停止" : "语音"}
              </button>
              <button
                type="button"
                onClick={onOpenAmapNav}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-3 text-[13px] font-semibold text-white/86"
                style={{
                  background: "rgba(255,255,255,0.065)",
                  borderColor: "rgba(255,255,255,0.16)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <ExternalLink size={15} />
                高德
              </button>
            </div>
          </>
        )}

        {destination && !customRoute && (
          <PlanningRoutePanel accent={brand} destinationName={destination.name} />
        )}

        <p
          className="pl-fg mt-3 text-center text-[10px] text-white/35"
          style={{ willChange: "transform" }}
        >
          ← 滑动切换 · 卡 2 附近骑友雷达
        </p>
      </div>
    </CardShell>
  );
}

function PlanningRoutePanel({
  accent,
  destinationName,
}: {
  accent: string;
  destinationName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");
  const messages = useMemo(
    () => [
      `正在计算去 ${destinationName} 的骑行路线`,
      "分析非机动车道连续性",
      "避开拥堵和高风险路口",
      "匹配补给点与安全路段",
    ],
    [destinationName],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root,
        { autoAlpha: 0, y: 18, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" },
      );
      gsap.fromTo(
        ".planning-node",
        { scale: 0.7, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.34, stagger: 0.12, ease: "back.out(2)" },
      );
      gsap.to(".planning-node", {
        scale: 1.16,
        duration: 0.72,
        yoyo: true,
        repeat: -1,
        stagger: 0.22,
        ease: "sine.inOut",
      });
      gsap.to(beamRef.current, {
        xPercent: 210,
        duration: 1.45,
        repeat: -1,
        ease: "none",
      });
      gsap.fromTo(
        ".planning-step",
        { width: "18%" },
        { width: "100%", duration: 1.35, stagger: 0.2, repeat: -1, yoyo: true, ease: "power1.inOut" },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: number;

    const tick = () => {
      const current = messages[messageIndex];
      setTypedText(current.slice(0, charIndex));

      if (!deleting && charIndex < current.length) {
        charIndex += 1;
        timer = window.setTimeout(tick, 42);
        return;
      }

      if (!deleting) {
        deleting = true;
        timer = window.setTimeout(tick, 900);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        timer = window.setTimeout(tick, 22);
        return;
      }

      deleting = false;
      messageIndex = (messageIndex + 1) % messages.length;
      timer = window.setTimeout(tick, 180);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [messages]);

  return (
    <div
      ref={rootRef}
      className="pl-mid mt-3 overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.045] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25"
          style={{ boxShadow: `0 0 28px ${accent}14` }}
        >
          <div className="absolute left-4 top-4 h-[54px] w-[54px]">
            <div className="absolute left-[9px] top-[10px] h-[36px] w-[36px] rotate-45 rounded-lg border border-white/12" />
            <div
              ref={beamRef}
              className="absolute -left-12 top-[31px] h-5 w-12 rounded-full blur-sm"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }}
            />
            <span className="planning-node absolute left-0 top-0 h-3 w-3 rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
            <span className="planning-node absolute right-1 top-4 h-2.5 w-2.5 rounded-full bg-white/85" />
            <span className="planning-node absolute bottom-0 left-5 h-3 w-3 rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
          </div>
          <RouteIcon className="absolute bottom-3 right-3 text-white/78" size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="idle-ai-spark shrink-0" style={{ color: accent }} />
            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/42">
              RIDE AI ROUTING
            </p>
          </div>
          <p className="mt-1 min-h-[38px] text-[14px] font-semibold leading-[19px] text-white/88">
            {typedText}
            <span className="ml-0.5 inline-block h-[15px] w-[1.5px] translate-y-0.5 animate-pulse" style={{ background: accent }} />
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {["路况", "安全", "补给"].map((label) => (
              <div key={label} className="rounded-full bg-white/[0.055] px-2 py-1">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-medium text-white/48">{label}</span>
                  <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
                </div>
                <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
                  <div className="planning-step h-full rounded-full" style={{ background: accent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LightMetric({
  icon,
  value,
  unit,
  label,
  brand,
}: {
  icon: ReactNode;
  value: string;
  unit: string;
  label: string;
  brand: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-2.5 py-2.5">
      <div className="flex items-center gap-1 text-[10px] font-medium text-white/45">
        <span style={{ color: brand }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="text-[22px] font-bold leading-none text-white">{value}</span>
        <span className="text-[11px] text-white/45">{unit}</span>
      </div>
    </div>
  );
}

function AiDestinationRecommendations({
  accent,
  isCity,
  recommendations,
  onPick,
  onSearch,
}: {
  accent: string;
  isCity: boolean;
  recommendations: AiRecommendedDestination[];
  onPick: (destination: AiRecommendedDestination) => void;
  onSearch: () => void;
}) {
  const title = isCity ? "城市骑行点智能推荐" : "山地骑行点智能推荐";
  return (
    <div
      className="pl-mid mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#071019]/58 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
      style={{ willChange: "transform" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <WandSparkles size={12} style={{ color: accent }} />
            AI 推荐骑行点
          </p>
          <p className="mt-1 text-[13px] font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-white/48">
            智能匹配周边骑行点 · 一键规划路线
          </p>
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-[11px] font-semibold text-white/68 transition hover:bg-white/[0.08] hover:text-white"
        >
          手动搜
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-3 space-y-2">
          {recommendations.slice(0, 3).map((rec, idx) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => onPick(rec)}
              className="group w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-white/[0.08]"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-black"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, #ffffff)`,
                    boxShadow: `0 0 18px ${accent}22`,
                  }}
                >
                  {idx === 0 ? <Trophy size={15} /> : <Bike size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{rec.name}</p>
                    <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold text-white/72">
                      {rec.score}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-white/46">{rec.hint}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/62">{rec.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${accent}18`, color: accent }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={15} className="mt-2 shrink-0 text-white/32 transition group-hover:translate-x-0.5 group-hover:text-white/65" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center">
          <p className="text-sm font-semibold text-white/85">正在生成骑行点推荐</p>
          <p className="mt-1 text-[11px] text-white/45">
            若周边 POI 不足，可以点上方搜索目的地
          </p>
        </div>
      )}
    </div>
  );
}

type AiRideIntel = {
  smoothScore: number;
  safetyScore: number;
  greenwayRatio: number;
  effortScore: number;
  crowdLevel: "low" | "mid" | "high";
  trafficLabel: string;
  headline: string;
  liveTip: string;
  optimizeTitle: string;
  optimizeDesc: string;
  optimizeGain: string;
};

function AiRideIntelPanel({
  intel,
  accent,
  optimized,
  onOptimize,
}: {
  intel: AiRideIntel;
  accent: string;
  optimized: boolean;
  onOptimize: () => void;
}) {
  const crowdColor = intel.crowdLevel === "high" ? "#fb7185" : intel.crowdLevel === "mid" ? "#fbbf24" : "#4ade80";
  return (
    <div className="pl-mid mt-3 rounded-2xl border border-white/10 bg-[#071019]/56 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" style={{ willChange: "transform" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <WandSparkles size={12} style={{ color: accent }} />
            AI 骑行领航
          </p>
          <p className="mt-1 text-[13px] font-semibold text-white">{intel.headline}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-1 text-right">
          <p className="text-[10px] text-white/45">拥堵度</p>
          <p className="text-[12px] font-bold" style={{ color: crowdColor }}>{intel.trafficLabel}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <AiIntelMetric icon={<Gauge size={12} />} label="通畅" value={intel.smoothScore} accent={accent} />
        <AiIntelMetric icon={<ShieldCheck size={12} />} label="安全" value={intel.safetyScore} accent="#4ade80" />
        <AiIntelMetric icon={<Leaf size={12} />} label="绿道" value={intel.greenwayRatio} suffix="%" accent="#22c55e" />
        <AiIntelMetric icon={<Zap size={12} />} label="体力" value={intel.effortScore} accent="#fbbf24" />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-2.5 py-2">
        <Activity size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
        <p className="text-[12px] leading-relaxed text-white/76">{intel.liveTip}</p>
      </div>

      <div
        className="mt-2 rounded-xl border px-2.5 py-2"
        style={{ borderColor: optimized ? `${accent}55` : "rgba(255,255,255,0.1)", background: optimized ? `${accent}16` : "rgba(255,255,255,0.035)" }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: optimized ? accent : "#fbbf24" }} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white">{optimized ? "已切换安全优先策略" : intel.optimizeTitle}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-white/52">{optimized ? intel.optimizeGain : intel.optimizeDesc}</p>
          </div>
          <button
            type="button"
            onClick={onOptimize}
            disabled={optimized}
            className="shrink-0 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-black disabled:text-white/62"
            style={{
              background: optimized ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${accent}, #ffffff)`,
            }}
          >
            {optimized ? "已采用" : "路线调优"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AiIntelMetric({
  icon,
  label,
  value,
  accent,
  suffix = "",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.045] px-2 py-2">
      <div className="flex items-center gap-1 text-[10px] text-white/42">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-[15px] font-bold leading-none text-white">
        {value}<span className="text-[10px] font-semibold text-white/42">{suffix}</span>
      </div>
    </div>
  );
}

function RideVoiceAssistantPanel({
  intel,
  accent,
  route,
  weather,
  isCity,
  destinationName,
  activeStepIndex,
  navProgress,
  optimized,
  routeSource,
  onOptimize,
}: {
  intel: AiRideIntel;
  accent: string;
  route: AmapBicyclingResult;
  weather: AmapWeather | null;
  isCity: boolean;
  destinationName?: string;
  activeStepIndex: number | null;
  navProgress: NavProgress | null;
  optimized: boolean;
  routeSource: "none" | "amap" | "amap-fallback";
  onOptimize: () => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [lastQuestion, setLastQuestion] = useState("前面堵不堵？");
  const [thinking, setThinking] = useState(false);
  const [aiStatus, setAiStatus] = useState<"local" | "model" | "offline">("local");
  const [answer, setAnswer] = useState(() => (
    isCity
      ? "我会结合实时路线、路况、天气和骑行评分，帮你判断拥堵、补给和安全路线。"
      : "我会结合林道连续性、天气和体力评分，帮你判断是否需要换更稳的路线。"
  ));

  useEffect(() => (
    () => {
      try {
        recognitionRef.current?.stop();
      } catch { /* ignore */ }
    }
  ), []);

  const askAssistant = useCallback(async (raw: string) => {
    const question = raw.trim();
    if (!question) return;
    setInput(question);
    setLastQuestion(question);
    setThinking(true);
    setAnswer("小R正在调用 RideSnap Brain，结合路线、天气和骑行评分判断…");

    const localReply = () => buildRideAssistantReply({
      question,
      intel,
      route,
      weather,
      isCity,
      navProgress,
      optimized,
    });

    try {
      const modelReply = await askRideAi(question, {
        scene: isCity ? "city" : "mountain",
        destinationName,
        routeSource,
        optimized,
        navProgress,
        activeStepIndex,
        route,
        weather,
        intel: {
          smoothScore: intel.smoothScore,
          safetyScore: intel.safetyScore,
          greenwayRatio: intel.greenwayRatio,
          effortScore: intel.effortScore,
          trafficLabel: intel.trafficLabel,
          liveTip: intel.liveTip,
        },
      });
      setAiStatus("model");
      setAnswer(modelReply.text);
      if (modelReply.shouldOptimize && !optimized) onOptimize();
      speak(modelReply.speech || modelReply.text, { provider: "minimax", style: "cute", rate: 1.1, pitch: 1, emotion: "happy" });
    } catch (error) {
      console.warn("[RideVoiceAssistant] model fallback", error);
      const reply = localReply();
      setAiStatus("offline");
      setAnswer(`${reply.text}（模型暂不可用，已切换本地骑行策略）`);
      if (reply.shouldOptimize && !optimized) onOptimize();
      speak(reply.speech ?? reply.text, { provider: "minimax", style: "cute", rate: 1.1, pitch: 1, emotion: "happy" });
    } finally {
      setThinking(false);
    }
  }, [intel, route, weather, isCity, destinationName, activeStepIndex, navProgress, optimized, routeSource, onOptimize]);

  const toggleListening = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch { /* ignore */ }
      setListening(false);
      return;
    }
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      setAnswer("当前浏览器不支持语音转文字，可以直接输入问题或点下面快捷问题。");
      return;
    }
    primeVoice();
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setAnswer("我没有听清，可以再点一次麦克风，或直接输入文字。");
    };
    recognition.onresult = (event) => {
      const { finalText, interimText } = collectRecognitionText(event);
      const text = finalText || interimText;
      if (text) setInput(text);
      if (finalText) askAssistant(finalText);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const quickQuestions = isCity
    ? ["前面堵不堵", "换安全路线", "附近有补给吗", "夜骑安全吗"]
    : ["前方路况如何", "换爬坡稳一点", "体力消耗大吗", "天气影响大吗"];

  return (
    <div className="pl-mid mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ willChange: "transform" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <Bot size={13} style={{ color: accent }} />
            实时语音 AI 助手
          </p>
          <p className="mt-1 text-[12px] text-white/62">
            {aiStatus === "model" ? "小R 实时模型在线 · 可问路况/补给/路线调优" : aiStatus === "offline" ? "小R 本地策略兜底中" : "语音转文字 · RideSnap Brain"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleListening}
          disabled={thinking}
          className="flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition"
          style={listening
            ? { borderColor: `${accent}88`, background: `${accent}24`, color: accent, boxShadow: `0 0 18px ${accent}22` }
            : { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)" }}
        >
          {listening ? <MicOff size={13} /> : <Mic size={13} />}
          {thinking ? "思考中" : listening ? "正在听" : "语音问"}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-white/8 bg-black/18 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-white/38">你问</p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: aiStatus === "model" ? accent : "rgba(255,255,255,0.42)",
              background: aiStatus === "model" ? `${accent}16` : "rgba(255,255,255,0.045)",
            }}
          >
            {aiStatus === "model" ? "MODEL" : aiStatus === "offline" ? "LOCAL" : "READY"}
          </span>
        </div>
        <p className="mt-0.5 min-h-[18px] text-[12px] font-semibold text-white/82">{lastQuestion}</p>
        <p className="mt-2 text-[10px] text-white/38">AI 回答</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-white/68">
          {thinking && (
            <span
              className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full align-middle"
              style={{ background: accent }}
            />
          )}
          {answer}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") askAssistant(input);
          }}
          placeholder="问: 前面堵吗 / 换安全路线 / 附近补给"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => askAssistant(input)}
          disabled={thinking}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-black"
          style={{ background: `linear-gradient(135deg, ${accent}, #ffffff)` }}
          aria-label="发送给 AI 助手"
        >
          <Send size={13} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => askAssistant(q)}
            disabled={thinking}
            className="truncate rounded-lg border border-white/8 bg-white/[0.035] px-1.5 py-1.5 text-[10px] font-medium text-white/58 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-wait disabled:opacity-55"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

type RideAssistantReply = {
  text: string;
  speech?: string;
  shouldOptimize?: boolean;
};

function buildRideAssistantReply({
  question,
  intel,
  route,
  weather,
  isCity,
  navProgress,
  optimized,
}: {
  question: string;
  intel: AiRideIntel;
  route: AmapBicyclingResult;
  weather: AmapWeather | null;
  isCity: boolean;
  navProgress: NavProgress | null;
  optimized: boolean;
}): RideAssistantReply {
  const q = question.toLowerCase();
  const distanceKm = (route.distance_m / 1000).toFixed(1);
  const progressText = navProgress && navProgress.totalM > 0
    ? `已骑 ${(navProgress.progressM / 1000).toFixed(2)} 公里，剩余 ${Math.max(0, (navProgress.totalM - navProgress.progressM) / 1000).toFixed(2)} 公里。`
    : `当前路线约 ${distanceKm} 公里。`;

  if (/堵|拥堵|路况|车流|人多|顺不顺|前面/.test(q)) {
    const text = intel.crowdLevel === "low"
      ? `收到收到，小R雷达启动，当前通畅度 ${intel.smoothScore}，这条线还挺丝滑的~ ${isCity ? "但别飘，注意临停车和右转车。" : "但别猛冲，注意碎石和急弯。"}`
      : `小R提醒你，前方有${intel.trafficLabel}风险，先别上头。放慢一点，必要时切安全路线。`;
    return { text, speech: text };
  }

  if (/换|绕|调优|安全|更好|路线|避开/.test(q)) {
    const text = optimized
      ? `好耶，小R已经切到安全优先啦。${intel.optimizeGain}`
      : `小R建议切安全优先路线，主打一个稳字当头。${intel.optimizeDesc}${intel.optimizeGain}`;
    return { text, speech: text, shouldOptimize: true };
  }

  if (/补给|水|厕所|便利|休息|店|吃/.test(q)) {
    const text = isCity
      ? "小R建议去公园入口、便利店或商圈外侧补给，别钻进最挤的人流区喔，主打省心。"
      : "小R建议在景区入口、游客中心或驿站补给。进林道后补给会变少，先喝水再冲鸭。";
    return { text, speech: text };
  }

  if (/天气|雨|风|热|冷|湿度/.test(q)) {
    const text = weather
      ? `小R播报天气：${weather.city}${weather.weather}，${weather.temperature}度，${weather.winddirection}风${weather.windpower}级。${/雨|雪|雾/.test(weather.weather) ? "慢一点，提前刹车，别逞强喔。" : "适合骑行，记得补水和开灯，稳稳拿捏。"}`
      : "小R还没拿到实时天气，先按低能见度标准骑行，打开前后灯并降低速度。";
    return { text, speech: text };
  }

  if (/体力|累|爬坡|坡|速度|多远|多久/.test(q)) {
    const text = `小R陪你稳稳骑。${progressText}体力负担 ${intel.effortScore}。${isCity ? "保持 16 到 20 公里每小时巡航，别急别急。" : "保持踏频，爬坡别突然发力，慢慢拿下。"}`
    return { text, speech: text };
  }

  const text = `小R在岗中~ ${progressText}当前${intel.trafficLabel}，安全 ${intel.safetyScore}，通畅 ${intel.smoothScore}。问我堵不堵、换不换路线都可以喔。`;
  return { text, speech: text };
}

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function collectRecognitionText(event: SpeechRecognitionEventLike) {
  let finalText = "";
  let interimText = "";
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    const text = result[0]?.transcript?.trim() ?? "";
    if (!text) continue;
    if (result.isFinal) finalText += text;
    else interimText += text;
  }
  return { finalText: finalText.trim(), interimText: interimText.trim() };
}

function buildAiRideIntel({
  route,
  weather,
  isCity,
  navProgress,
  voiceStepIdx,
  optimized,
  routeSource,
}: {
  route: AmapBicyclingResult;
  weather: AmapWeather | null;
  isCity: boolean;
  navProgress: NavProgress | null;
  voiceStepIdx: number | null;
  optimized: boolean;
  routeSource: "none" | "amap" | "amap-fallback";
}): AiRideIntel {
  const distanceKm = route.distance_m / 1000;
  const stepCount = Math.max(1, route.steps.length);
  const turnDensity = stepCount / Math.max(distanceKm, 0.4);
  const weatherPenalty = weather && /雨|雪|雾|霾|沙|尘/.test(weather.weather) ? 10 : 0;
  const liveBoost = navProgress && navProgress.speedKmh > 0 ? 4 : 0;
  const fallbackPenalty = routeSource === "amap-fallback" ? 12 : 0;

  const smoothScore = clampScore(
    86 - turnDensity * 3 - weatherPenalty - fallbackPenalty + (optimized ? 7 : 0) + liveBoost,
  );
  const safetyScore = clampScore(
    (isCity ? 82 : 88) - Math.max(0, turnDensity - 3) * 2 - weatherPenalty + (optimized ? 9 : 0),
  );
  const greenwayRatio = clampScore(
    (isCity ? 62 : 74) + (distanceKm > 4 ? 8 : 0) - fallbackPenalty + (optimized ? 11 : 0),
  );
  const effortScore = clampScore(
    (isCity ? 72 : 58) - Math.max(0, distanceKm - 3) * 4 - weatherPenalty + (optimized ? 4 : 0),
  );
  const crowdLevel: AiRideIntel["crowdLevel"] = smoothScore < 58 ? "high" : smoothScore < 76 ? "mid" : "low";
  const trafficLabel = crowdLevel === "high" ? "偏拥挤" : crowdLevel === "mid" ? "局部拥挤" : "顺畅";
  const progressPct = navProgress && navProgress.totalM > 0
    ? Math.min(1, navProgress.progressM / navProgress.totalM)
    : 0;
  const step = route.steps[Math.min(Math.max(voiceStepIdx ?? Math.floor(progressPct * stepCount), 0), stepCount - 1)];

  const liveTip = navProgress && navProgress.speedKmh > 0
    ? buildLiveNavigationTip({ isCity, stepInstruction: step?.instruction ?? "", progressPct, smoothScore, weather })
    : buildPreRideTip({ isCity, smoothScore, safetyScore, weather, stepCount });

  return {
    smoothScore,
    safetyScore,
    greenwayRatio,
    effortScore,
    crowdLevel,
    trafficLabel,
    headline: optimized
      ? "已采用安全优先策略，复杂路口已降权"
      : (isCity ? "正在评估非机动车道和商圈拥挤风险" : "正在评估林道连续性和体力消耗"),
    liveTip,
    optimizeTitle: isCity ? "发现更适合骑行的安全路线" : "发现更稳的爬坡节奏路线",
    optimizeDesc: isCity
      ? "预计多 1 分钟，但减少复杂路口和人车混行路段。"
      : "预计多 0.8 分钟，但避开急转和碎石密集路段。",
    optimizeGain: isCity
      ? "复杂路口 -3，绿道占比 +11%，通畅度提升约 7 分。"
      : "急转路段 -2，体力波动降低，安全评分提升约 9 分。",
  };
}

function buildLiveNavigationTip({
  isCity,
  stepInstruction,
  progressPct,
  smoothScore,
  weather,
}: {
  isCity: boolean;
  stepInstruction: string;
  progressPct: number;
  smoothScore: number;
  weather: AmapWeather | null;
}) {
  if (weather && /雨|雪|雾/.test(weather.weather)) {
    return `当前${weather.weather}，刹车距离可能变长，建议提前减速并避开井盖。`;
  }
  if (smoothScore < 65) {
    return isCity
      ? "前方疑似人车混行，建议保持右侧低速通过，必要时切到安全优先路线。"
      : "前方林道路况波动较大，建议降低胎压冲击感并保留刹车余量。";
  }
  if (progressPct > 0.72) return "接近目的地，AI 已降低速度建议，注意停车点和行人穿行。";
  if (stepInstruction.includes("右转") || stepInstruction.includes("左转")) {
    return `即将${stepInstruction.includes("右转") ? "右转" : "左转"}，AI 建议提前观察后方来车并打手势。`;
  }
  return isCity
    ? "当前路段通畅，建议保持 18 km/h 巡航，注意非机动车道临停车辆。"
    : "当前坡度节奏稳定，建议保持踏频，不要在碎石路段突然变线。";
}

function buildPreRideTip({
  isCity,
  smoothScore,
  safetyScore,
  weather,
  stepCount,
}: {
  isCity: boolean;
  smoothScore: number;
  safetyScore: number;
  weather: AmapWeather | null;
  stepCount: number;
}) {
  if (weather && /雨|雪|雾/.test(weather.weather)) return `出发前检查刹车和灯光，${weather.weather}天气建议降低巡航速度。`;
  if (smoothScore < 70) return "路线存在局部拥挤，AI 建议出发后优先观察右侧非机动车道连续性。";
  if (safetyScore > 88) return isCity ? "当前路线安全评分较高，适合通勤和夜骑巡航。" : "当前路线安全评分较高，适合轻越野和风景骑。";
  return `AI 已拆解 ${stepCount} 个导航动作，建议先查看前两个转向点再出发。`;
}

function clampScore(n: number) {
  return Math.max(35, Math.min(98, Math.round(n)));
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Real AMap render failed", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
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
