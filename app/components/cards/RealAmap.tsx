"use client";

import gsap from "gsap";
import { Compass, Layers3, LocateFixed, Minus, Plus, RefreshCw, Route as RouteIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isValidLatLng } from "../../lib/amap";
import { loadAmap } from "../../lib/amap-loader";
import type { LatLng } from "../../lib/geo";
import type { NavProgress } from "./card-types";

/* ── 高德命名空间最小类型 (无官方类型, 运行时用 unknown 守卫) ── */
type AnyOverlay = unknown;
type AnyMarker = {
  setPosition: (p: unknown) => void;
  setContent?: (s: string) => void;
};
type AnyMapInstance = {
  on(event: string, handler: () => void): void;
  off?(event: string, handler: () => void): void;
  add(o: AnyOverlay): void;
  remove(o: AnyOverlay | AnyOverlay[]): void;
  addControl?(c: AnyOverlay): void;
  setFitView?(arr: AnyOverlay[] | null, immediately?: boolean, avoid?: number[]): void;
  setZoom?(zoom: number): void;
  getZoom?(): number;
  setCenter?(center: unknown): void;
  setZoomAndCenter?(zoom: number, center: unknown): void;
  setPitch?(pitch: number): void;
  setRotation?(rotation: number): void;
  panTo?(center: unknown): void;
  resize?(): void;
  getContainer?(): HTMLElement | null;
  destroy(): void;
};
type AnyAMap = {
  Map: new (container: HTMLElement, opts: Record<string, unknown>) => AnyMapInstance;
  Marker: new (opts: Record<string, unknown>) => AnyOverlay;
  Polyline: new (opts: Record<string, unknown>) => AnyOverlay;
  Pixel: new (x: number, y: number) => unknown;
  LngLat: new (lng: number, lat: number) => unknown;
  ToolBar?: new (opts?: Record<string, unknown>) => AnyOverlay;
  Scale?: new (opts?: Record<string, unknown>) => AnyOverlay;
  TileLayer?: { Traffic: new (opts?: Record<string, unknown>) => AnyOverlay };
};

export type RealAmapProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  polyline: LatLng[];
  accent: string;
  myPosition?: LatLng | null;
  myBearing?: number;
  navProgress?: NavProgress | null;
  fallback?: React.ReactNode;
};

export function RealAmap({
  origin,
  destination,
  polyline,
  accent,
  myPosition,
  myBearing = 0,
  navProgress,
}: RealAmapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMapInstance | null>(null);
  const amapRef = useRef<AnyAMap | null>(null);
  const overlaysRef = useRef<AnyOverlay[]>([]);
  const myMarkerRef = useRef<(AnyOverlay & AnyMarker) | null>(null);
  const trafficRef = useRef<AnyOverlay | null>(null);
  const routeKeyRef = useRef<string>("");
  const roRef = useRef<ResizeObserver | null>(null);

  const [ready, setReady] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [initialCenter] = useState(
    () => pickMapCenter(origin, destination, polyline) ?? [120.0918, 30.1846],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".amap-hud-panel, .amap-map-control, .amap-nav-progress",
        { y: 10, autoAlpha: 0, scale: 0.98 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.48, ease: "power3.out", stagger: 0.05 },
      );
      gsap.to(".amap-map-scan", {
        rotate: 360,
        duration: 5.2,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(".amap-route-glint", {
        xPercent: 170,
        duration: 2.4,
        ease: "power1.inOut",
        repeat: -1,
        repeatDelay: 0.25,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  /* ── 建图 (一次) ── */
  useEffect(() => {
    let cancelled = false;
    loadAmap(["AMap.ToolBar", "AMap.Scale", "AMap.TileLayer.Traffic"])
      .then((nsRaw) => {
        if (cancelled || !containerRef.current) return;
        const ns = nsRaw as AnyAMap;
        amapRef.current = ns;
        const map = new ns.Map(containerRef.current, {
          // 真实高德 3D 底图 + 自定义卡片 HUD。默认控件不再使用, 避免旧式 UI 和项目风格冲突。
          viewMode: "3D",
          pitch: 62,
          rotation: 335,
          pitchEnable: true,
          rotateEnable: true,
          zoom: 16.6,
          zooms: [3, 20],
          center: initialCenter,
          mapStyle: "amap://styles/normal",
          showLabel: true,
          showBuildingBlock: true,
          buildingAnimation: true,
          skyColor: "#07111f",
          features: ["bg", "road", "building", "point"],
          dragEnable: true,
          zoomEnable: true,
          scrollWheel: true,
          doubleClickZoom: true,
          jogEnable: false,
        });
        mapRef.current = map;

        // 容器在淡入/尺寸未稳定时建图, 高德常测到高度 0 且不自动重算 → canvas 0 高度。
        // ready 后多次强制 resize, 并用 ResizeObserver 在容器尺寸变化时重算。
        const forceResize = () => {
          try {
            map.resize?.();
            applyCinematicView(map);
          } catch { /* ignore */ }
        };
        const onComplete = () => {
          if (cancelled) return;
          forceResize();
          setReady(true);
          [60, 200, 500, 900].forEach((d) => window.setTimeout(() => { if (!cancelled) forceResize(); }, d));
        };
        map.on("complete", onComplete);
        window.setTimeout(() => {
          if (!cancelled) { forceResize(); setReady(true); }
        }, 1000);

        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          const ro = new ResizeObserver(() => forceResize());
          ro.observe(containerRef.current);
          roRef.current = ro;
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error("[RealAmap] load failed", err);
      });

    return () => {
      cancelled = true;
      try {
        roRef.current?.disconnect();
      } catch { /* ignore */ }
      roRef.current = null;
      try {
        mapRef.current?.destroy();
      } catch { /* race */ }
      mapRef.current = null;
      amapRef.current = null;
      overlaysRef.current = [];
      myMarkerRef.current = null;
      trafficRef.current = null;
    };
  }, [initialCenter]);

  /* ── 路线 + 起终点 marker ── */
  useEffect(() => {
    const map = mapRef.current;
    const ns = amapRef.current;
    if (!ready || !map || !ns) return;

    const safeOrigin = isValidLatLng(origin) ? origin : null;
    const safeDest = isValidLatLng(destination) ? destination : null;
    const line = normalizePolyline(polyline);

    const key = `${line.length}:${line[0]?.lng ?? 0},${line[0]?.lat ?? 0}:${line[line.length - 1]?.lng ?? 0}:${safeDest?.lng ?? 0}`;
    if (key === routeKeyRef.current) return;
    routeKeyRef.current = key;

    // 清旧覆盖物
    for (const o of overlaysRef.current) safeAdd(() => map.remove(o));
    overlaysRef.current = [];

    const fitTargets: AnyOverlay[] = [];

    if (line.length >= 2) {
      const path = line.map((p) => new ns.LngLat(p.lng, p.lat));
      safeAdd(() => {
        const glow = new ns.Polyline({ path, strokeColor: accent, strokeWeight: 13, strokeOpacity: 0.2, lineJoin: "round" });
        map.add(glow);
        overlaysRef.current.push(glow);
      });
      safeAdd(() => {
        const core = new ns.Polyline({ path, strokeColor: accent, strokeWeight: 6, strokeOpacity: 0.95, lineJoin: "round", showDir: true });
        map.add(core);
        overlaysRef.current.push(core);
        fitTargets.push(core);
      });
    } else if (safeOrigin && safeDest) {
      safeAdd(() => {
        const dashed = new ns.Polyline({
          path: [new ns.LngLat(safeOrigin.lng, safeOrigin.lat), new ns.LngLat(safeDest.lng, safeDest.lat)],
          strokeColor: accent, strokeWeight: 4, strokeOpacity: 0.6, strokeStyle: "dashed",
        });
        map.add(dashed);
        overlaysRef.current.push(dashed);
        fitTargets.push(dashed);
      });
    }

    if (safeOrigin) {
      safeAdd(() => {
        const m = new ns.Marker({
          position: new ns.LngLat(safeOrigin.lng, safeOrigin.lat),
          anchor: "bottom-center",
          content: markerPinHtml("起点", "#22c55e"),
        });
        map.add(m);
        overlaysRef.current.push(m);
        fitTargets.push(m);
      });
    }
    if (safeDest) {
      safeAdd(() => {
        const m = new ns.Marker({
          position: new ns.LngLat(safeDest.lng, safeDest.lat),
          anchor: "bottom-center",
          content: markerPinHtml("终点", accent),
        });
        map.add(m);
        overlaysRef.current.push(m);
        fitTargets.push(m);
      });
    }

    // 自动缩放到完整路线 (留边距)
    safeAdd(() => {
      if (fitTargets.length > 0 && map.setFitView) {
        map.setFitView(fitTargets, false, [52, 38, 64, 38]);
        window.setTimeout(() => applyCinematicView(map), 80);
      } else if (safeDest) {
        map.setZoomAndCenter?.(16.6, new ns.LngLat(safeDest.lng, safeDest.lat));
        applyCinematicView(map);
      }
    });
  }, [ready, origin, destination, polyline, accent]);

  /* ── 我的位置 (导航中, 箭头跟随) ── */
  useEffect(() => {
    const map = mapRef.current;
    const ns = amapRef.current;
    if (!ready || !map || !ns) return;

    const me = isValidLatLng(myPosition ?? null) ? myPosition! : null;
    if (!me) {
      if (myMarkerRef.current) {
        safeAdd(() => map.remove(myMarkerRef.current));
        myMarkerRef.current = null;
      }
      return;
    }
    const pos = new ns.LngLat(me.lng, me.lat);
    if (!myMarkerRef.current) {
      safeAdd(() => {
        const m = new ns.Marker({ position: pos, anchor: "center", zIndex: 200, content: myPositionHtml(accent, myBearing) });
        map.add(m);
        myMarkerRef.current = m as AnyOverlay & AnyMarker;
      });
    } else {
      safeAdd(() => {
        myMarkerRef.current!.setPosition(pos);
        myMarkerRef.current!.setContent?.(myPositionHtml(accent, myBearing));
      });
    }
    safeAdd(() => {
      map.panTo?.(pos);
      applyCinematicView(map, myBearing);
    });
  }, [ready, myPosition, myBearing, accent]);

  /* ── 实时路况图层切换 ── */
  useEffect(() => {
    const map = mapRef.current;
    const ns = amapRef.current;
    if (!ready || !map || !ns) return;
    safeAdd(() => {
      if (showTraffic && !trafficRef.current && ns.TileLayer) {
        const t = new ns.TileLayer.Traffic({ autoRefresh: true, interval: 60, zIndex: 10 });
        map.add(t);
        trafficRef.current = t;
      } else if (!showTraffic && trafficRef.current) {
        map.remove(trafficRef.current);
        trafficRef.current = null;
      }
    });
  }, [ready, showTraffic]);

  const remainingKm = navProgress
    ? Math.max(0, (navProgress.totalM - navProgress.progressM) / 1000).toFixed(2)
    : null;
  const progressPct = navProgress && navProgress.totalM > 0
    ? Math.min(100, (navProgress.progressM / navProgress.totalM) * 100)
    : 0;
  const routeDistanceKm = polyline.length >= 2
    ? estimatePolylineDistanceKm(normalizePolyline(polyline)).toFixed(1)
    : null;
  const isNavigating = !!navProgress && navProgress.speedKmh > 0;

  const changeZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getZoom?.() ?? 16;
    safeAdd(() => map.setZoom?.(Math.max(3, Math.min(20, current + delta))));
  };

  const refocusRoute = () => {
    const map = mapRef.current;
    const ns = amapRef.current;
    const center = pickMapCenter(origin, destination, polyline);
    if (!map || !ns || !center) return;
    safeAdd(() => {
      map.setZoomAndCenter?.(16.6, new ns.LngLat(center[0], center[1]));
      applyCinematicView(map);
    });
  };

  return (
    <div ref={rootRef} className="amap-card-host mt-3 relative h-[236px] overflow-hidden rounded-[18px] border border-white/10 bg-[#071019] shadow-[0_18px_38px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div ref={containerRef} className="h-full w-full transform-none" style={{ height: "236px" }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.15),transparent_26%),radial-gradient(circle_at_78%_72%,rgba(35,240,255,0.12),transparent_28%),linear-gradient(180deg,rgba(3,7,12,0.16),transparent_38%,rgba(3,7,12,0.48))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 via-black/24 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/68 via-black/24 to-transparent" />
      <div className="amap-map-scan pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full opacity-45 mix-blend-screen" style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${accent}00 210deg, ${accent}55 288deg, transparent 330deg)` }} />
      <div className="pointer-events-none absolute left-0 top-1/2 h-px w-3/5 -translate-x-1/2 overflow-hidden bg-transparent">
        <span className="amap-route-glint block h-px w-2/5 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>

      {!ready && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#071019]/72 text-[11px] text-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <RefreshCw size={12} className="animate-spin" style={{ color: accent }} />
            <span>AI 实时地图加载中</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 z-10 flex items-start justify-between gap-2">
        <div className="amap-hud-panel min-w-0 rounded-xl border border-white/10 bg-[#071019]/66 px-2.5 py-2 text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-lg" style={{ background: `${accent}22`, color: accent }}>
              <RouteIcon size={12} />
            </span>
            <span className="text-[10px] font-semibold uppercase text-white/55">AMap 3D</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-[13px] font-semibold text-white">骑行实况地图</span>
            {routeDistanceKm && <span className="text-[10px] text-white/45">{routeDistanceKm} km</span>}
          </div>
        </div>

        <div className="amap-hud-panel pointer-events-none flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-[#071019]/58 px-2 py-1.5 text-[10px] font-semibold text-white/65 shadow-[0_10px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <Compass size={12} style={{ color: accent, transform: `rotate(${myBearing}deg)` }} />
          {isNavigating ? "跟随航向" : "62° 俯瞰"}
        </div>
      </div>

      <div className="pointer-events-auto absolute right-2.5 top-[58px] z-10 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-[#071019]/54 p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <MapHudButton label="放大" onClick={() => changeZoom(1)}>
          <Plus size={13} />
        </MapHudButton>
        <MapHudButton label="缩小" onClick={() => changeZoom(-1)}>
          <Minus size={13} />
        </MapHudButton>
        <MapHudButton label="回到路线" onClick={refocusRoute}>
          <LocateFixed size={13} />
        </MapHudButton>
        <MapHudButton
          label={showTraffic ? "关闭路况" : "打开路况"}
          onClick={() => setShowTraffic((v) => !v)}
          active={showTraffic}
          accent={accent}
        >
          <Layers3 size={13} />
        </MapHudButton>
      </div>

      {navProgress && (
        <div className="amap-nav-progress absolute inset-x-2.5 bottom-2.5 z-10 rounded-xl border border-white/10 bg-[#071019]/74 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex items-center justify-between text-[10px] text-white/75">
            <span>已走 <span className="font-semibold text-white">{(navProgress.progressM / 1000).toFixed(2)}</span> km</span>
            <span>剩余 <span className="font-semibold text-white">{remainingKm}</span> km · {Math.round(navProgress.speedKmh)} km/h</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full shadow-[0_0_12px_currentColor]" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${accent}, #fff)`, color: accent }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* 把可能抛 Pixel(NaN) 的高德调用统一兜住, 防止冒泡到 React 触发 ErrorBoundary */
function safeAdd(fn: () => void) {
  try {
    fn();
  } catch { /* 投影未就绪时高德会抛 Pixel(NaN), 忽略本次即可 */ }
}

function applyCinematicView(map: AnyMapInstance, bearing = 25) {
  safeAdd(() => map.setPitch?.(62));
  safeAdd(() => map.setRotation?.(normalizeRotation(360 - bearing)));
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

function normalizePolyline(points: LatLng[]) {
  const out: LatLng[] = [];
  for (const p of points) {
    if (!isValidLatLng(p)) continue;
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.lng - p.lng) < 1e-6 && Math.abs(prev.lat - p.lat) < 1e-6) continue;
    out.push({ lng: p.lng, lat: p.lat });
  }
  return out;
}

function pickMapCenter(
  origin: LatLng | null,
  destination: LatLng | null,
  polyline: LatLng[],
): [number, number] | null {
  const valid = [
    ...normalizePolyline(polyline),
    isValidLatLng(origin) ? origin : null,
    isValidLatLng(destination) ? destination : null,
  ].filter(isValidLatLng);
  if (valid.length === 0) return null;
  const lng = valid.reduce((s, p) => s + p.lng, 0) / valid.length;
  const lat = valid.reduce((s, p) => s + p.lat, 0) / valid.length;
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
}

function markerPinHtml(text: string, bg: string) {
  return `<div style="position:relative;width:46px;height:52px;pointer-events:none;">
    <div style="position:absolute;left:8px;top:0;width:30px;height:30px;border-radius:999px;background:${bg};box-shadow:0 0 0 3px rgba(255,255,255,.95),0 10px 24px ${bg}66,0 0 28px ${bg}66;display:grid;place-items:center;">
      <div style="width:10px;height:10px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 2px rgba(0,0,0,.12);"></div>
    </div>
    <div style="position:absolute;left:22px;top:29px;width:2px;height:10px;background:${bg};box-shadow:0 0 10px ${bg};"></div>
    <div style="position:absolute;left:50%;top:38px;transform:translateX(-50%);font-size:10px;font-weight:700;color:#fff;background:rgba(5,10,18,.78);padding:2px 7px;border:1px solid rgba(255,255,255,.14);border-radius:999px;white-space:nowrap;backdrop-filter:blur(8px);">${text}</div>
  </div>`;
}

function myPositionHtml(accent: string, bearing: number) {
  return `<div style="position:relative;width:44px;height:44px;pointer-events:none;">
    <div class="amap-me-ring" style="background:${accent}33;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:${accent};box-shadow:0 0 0 3px #fff,0 4px 12px ${accent}99,0 0 22px ${accent};"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-100%) rotate(${bearing}deg);transform-origin:50% 100%;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #fff;filter:drop-shadow(0 0 4px ${accent});"></div>
  </div>`;
}

function MapHudButton({
  children,
  label,
  onClick,
  active = false,
  accent = "#23f0ff",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="amap-map-control grid h-7 w-7 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/12 hover:text-white active:scale-95"
      style={active ? { background: `${accent}28`, color: accent, boxShadow: `0 0 0 1px ${accent}44, 0 0 18px ${accent}22` } : undefined}
    >
      {children}
    </button>
  );
}

function estimatePolylineDistanceKm(points: LatLng[]) {
  let meters = 0;
  for (let i = 1; i < points.length; i += 1) {
    meters += haversineMeters(points[i - 1], points[i]);
  }
  return meters / 1000;
}

function haversineMeters(a: LatLng, b: LatLng) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
