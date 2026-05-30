"use client";

import { Layers3, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isValidLatLng } from "../../lib/amap";
import { loadAmap } from "../../lib/amap-loader";
import type { LatLng } from "../../lib/geo";
import type { NavProgress } from "./card-types";

type AnyAMap = {
  Map: new (container: HTMLElement, opts: Record<string, unknown>) => AnyMapInstance;
  Marker: new (opts: Record<string, unknown>) => AnyOverlay;
  Polyline: new (opts: Record<string, unknown>) => AnyOverlay;
  TileLayer: {
    Traffic: new (opts: Record<string, unknown>) => AnyOverlay;
    Satellite: new (opts: Record<string, unknown>) => AnyOverlay;
  };
};

type AnyMapInstance = {
  setMapStyle?(s: string): void;
  add(o: AnyOverlay): void;
  remove(o: AnyOverlay | AnyOverlay[]): void;
  setFitView(arr?: AnyOverlay[]): void;
  setPitch(p: number): void;
  setRotation?(deg: number): void;
  getPitch(): number;
  setCenter?(center: [number, number]): void;
  setZoomAndCenter?(zoom: number, center: [number, number]): void;
  panTo?(center: [number, number]): void;
  destroy(): void;
};

type AnyOverlay = unknown;
type AnyMarker = { setPosition: (p: [number, number]) => void; setContent?: (s: string) => void };

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
  fallback,
}: RealAmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMapInstance | null>(null);
  const overlaysRef = useRef<AnyOverlay[]>([]);
  const myMarkerRef = useRef<(AnyOverlay & AnyMarker) | null>(null);
  const trafficRef = useRef<AnyOverlay | null>(null);
  const satelliteRef = useRef<AnyOverlay | null>(null);
  const amapRef = useRef<AnyAMap | null>(null);
  const fitDoneRef = useRef(false);
  const lastPolylineKeyRef = useRef<string>("");
  const [is3D, setIs3D] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAmap(["AMap.TileLayer.Traffic", "AMap.TileLayer.Satellite"])
      .then((ns) => {
        if (cancelled) return;
        amapRef.current = ns as AnyAMap;
        if (!containerRef.current) return;
        const map = new (ns as AnyAMap).Map(containerRef.current, {
          zoom: 15,
          pitch: 50,
          viewMode: "3D",
          center: [120.7, 27.9],
          mapStyle: "amap://styles/dark",
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(String(err));
      });
    return () => {
      cancelled = true;
      try {
        mapRef.current?.destroy();
      } catch {
        /* race */
      }
      mapRef.current = null;
      amapRef.current = null;
      overlaysRef.current = [];
      myMarkerRef.current = null;
      trafficRef.current = null;
      satelliteRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    try {
      for (const o of overlaysRef.current) map.remove(o);
      overlaysRef.current = [];

      const safeOrigin = isValidLatLng(origin) ? origin : null;
      const safeDestination = isValidLatLng(destination) ? destination : null;
      const safePolyline = polyline.filter(isValidLatLng);

      if (safePolyline.length >= 2) {
        const path = safePolyline.map((p) => [p.lng, p.lat]);
        const glow = new ns.Polyline({
          path,
          strokeColor: accent,
          strokeWeight: 14,
          strokeOpacity: 0.18,
          lineJoin: "round",
        });
        const core = new ns.Polyline({
          path,
          strokeColor: accent,
          strokeWeight: 6,
          strokeOpacity: 0.95,
          lineJoin: "round",
          showDir: true,
        });
        map.add(glow);
        map.add(core);
        overlaysRef.current.push(glow, core);
      } else if (safeOrigin && safeDestination) {
        const dashed = new ns.Polyline({
          path: [
            [safeOrigin.lng, safeOrigin.lat],
            [safeDestination.lng, safeDestination.lat],
          ],
          strokeColor: accent,
          strokeWeight: 3,
          strokeOpacity: 0.55,
          strokeStyle: "dashed",
        });
        map.add(dashed);
        overlaysRef.current.push(dashed);
      }

      if (safeOrigin) {
        const m = new ns.Marker({
          position: [safeOrigin.lng, safeOrigin.lat],
          anchor: "bottom-center",
          offset: [0, 0],
          content: markerPinHtml("起", "#22c55e", "white", "▶"),
        });
        map.add(m);
        overlaysRef.current.push(m);
      }
      if (safeDestination) {
        const m = new ns.Marker({
          position: [safeDestination.lng, safeDestination.lat],
          anchor: "bottom-center",
          content: markerPinHtml("终", "#ef4444", "white", "🏁"),
        });
        map.add(m);
        overlaysRef.current.push(m);
      }

      const last = safePolyline[safePolyline.length - 1];
      const polylineKey = `${safePolyline.length}:${safePolyline[0]?.lng ?? 0},${safePolyline[0]?.lat ?? 0}:${last?.lng ?? 0},${last?.lat ?? 0}`;
      if (polylineKey !== lastPolylineKeyRef.current) {
        lastPolylineKeyRef.current = polylineKey;
        fitDoneRef.current = false;
      }
      if (!fitDoneRef.current && overlaysRef.current.length > 0) {
        map.setFitView(overlaysRef.current);
        fitDoneRef.current = true;
      }
    } catch (err) {
      const message = `路线渲染失败: ${err instanceof Error ? err.message : String(err)}`;
      window.setTimeout(() => setError(message), 0);
    }
  }, [ready, origin, destination, polyline, accent]);

  /** 我的位置: marker + 视角跟随 */
  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    if (!isValidLatLng(myPosition ?? null)) {
      if (myMarkerRef.current) {
        try { map.remove(myMarkerRef.current); } catch { /* ignore */ }
        myMarkerRef.current = null;
      }
      return;
    }
    const pos: [number, number] = [myPosition!.lng, myPosition!.lat];
    if (!myMarkerRef.current) {
      const m = new ns.Marker({
        position: pos,
        anchor: "center",
        zIndex: 200,
        content: myPositionHtml(accent, myBearing),
      });
      map.add(m);
      myMarkerRef.current = m as AnyOverlay & AnyMarker;
    } else {
      try {
        myMarkerRef.current.setPosition(pos);
        myMarkerRef.current.setContent?.(myPositionHtml(accent, myBearing));
      } catch {
        /* ignore */
      }
    }
    if (followMe) {
      try {
        if (map.panTo) map.panTo(pos);
        else map.setCenter?.(pos);
      } catch {
        /* ignore */
      }
    }
  }, [ready, myPosition, myBearing, accent, followMe]);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    try {
      if (showTraffic && !trafficRef.current) {
        const t = new ns.TileLayer.Traffic({ autoRefresh: true, interval: 60, zIndex: 10 });
        map.add(t);
        trafficRef.current = t;
      } else if (!showTraffic && trafficRef.current) {
        map.remove(trafficRef.current);
        trafficRef.current = null;
      }
    } catch {
      trafficRef.current = null;
    }
  }, [ready, showTraffic]);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    try {
      if (showSatellite && !satelliteRef.current) {
        const s = new ns.TileLayer.Satellite({ zIndex: 5 });
        map.add(s);
        satelliteRef.current = s;
      } else if (!showSatellite && satelliteRef.current) {
        map.remove(satelliteRef.current);
        satelliteRef.current = null;
      }
    } catch {
      satelliteRef.current = null;
    }
  }, [ready, showSatellite]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setPitch(is3D ? 50 : 0);
  }, [ready, is3D]);

  if (error) {
    return (
      <div className="pl-mid mt-3 relative h-[220px] overflow-hidden rounded-2xl border border-white/12 bg-black/35">
        {fallback ?? (
          <div className="grid h-full place-items-center px-4 text-center text-[12px] text-white/55">
            地图加载失败: {error}
          </div>
        )}
      </div>
    );
  }

  const progressPct = navProgress && navProgress.totalM > 0
    ? Math.min(100, (navProgress.progressM / navProgress.totalM) * 100)
    : 0;
  const remainingKm = navProgress
    ? Math.max(0, (navProgress.totalM - navProgress.progressM) / 1000).toFixed(2)
    : null;

  return (
    <div
      className="pl-mid mt-3 relative h-[220px] overflow-hidden rounded-2xl border border-white/12 bg-black/35"
      style={{ willChange: "transform" }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-black/40 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={12} className="animate-spin" />
            高德地图加载中…
          </span>
        </div>
      )}
      <div className="pl-fg pointer-events-auto absolute right-2 top-2 z-10 flex flex-col gap-1.5" style={{ willChange: "transform" }}>
        <LayerToggle on={is3D} label="3D" onClick={() => setIs3D((v) => !v)} accent={accent} />
        <LayerToggle on={showTraffic} label="路况" onClick={() => setShowTraffic((v) => !v)} accent={accent} />
        <LayerToggle
          on={showSatellite}
          label="卫星"
          icon={<Layers3 size={10} />}
          onClick={() => setShowSatellite((v) => !v)}
          accent={accent}
        />
        {myPosition && (
          <LayerToggle
            on={followMe}
            label="跟随"
            onClick={() => setFollowMe((v) => !v)}
            accent={accent}
          />
        )}
      </div>

      {navProgress && (
        <div className="pl-fg pointer-events-none absolute inset-x-2 bottom-2 z-10 rounded-xl border border-white/12 bg-black/65 px-3 py-2 backdrop-blur-md" style={{ willChange: "transform" }}>
          <div className="flex items-center justify-between text-[10px] text-white/70">
            <span>
              已走 <span className="font-semibold text-white">{(navProgress.progressM / 1000).toFixed(2)}</span> km
            </span>
            <span>
              剩余 <span className="font-semibold text-white">{remainingKm}</span> km · {Math.round(navProgress.speedKmh)} km/h
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${accent}, white)`,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LayerToggle({
  on,
  label,
  icon,
  accent,
  onClick,
}: {
  on: boolean;
  label: string;
  icon?: React.ReactNode;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition"
      style={
        on
          ? { background: `${accent}26`, color: accent, boxShadow: `0 0 0 1px ${accent}55` }
          : {
              background: "rgba(0,0,0,0.55)",
              color: "rgba(255,255,255,0.6)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
            }
      }
    >
      {icon}
      {label}
    </button>
  );
}

function markerPinHtml(text: string, bg: string, color: string, emoji?: string) {
  return `<div style="
    position:relative;
    transform:translateY(0);
    pointer-events:none;
  ">
    <div style="
      background:${bg};
      color:${color};
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:grid;place-items:center;
      box-shadow:0 6px 18px rgba(0,0,0,.6), 0 0 0 3px ${bg}55;
      border:2px solid white;
    ">
      <span style="transform:rotate(45deg);font-size:13px;font-weight:800;line-height:1;">
        ${emoji ?? text}
      </span>
    </div>
    <div style="
      position:absolute;left:50%;top:34px;
      transform:translateX(-50%);
      font-size:9px;font-weight:700;color:white;
      background:rgba(0,0,0,0.7);
      padding:1px 6px;border-radius:999px;
      white-space:nowrap;
    ">${text}点</div>
  </div>`;
}

function myPositionHtml(accent: string, bearing: number) {
  return `<div style="position:relative;width:44px;height:44px;pointer-events:none;">
    <div class="amap-me-ring" style="background:${accent}33;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:${accent};box-shadow:0 0 0 3px white, 0 4px 12px ${accent}99;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-100%) rotate(${bearing}deg);transform-origin:50% 100%;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid white;filter:drop-shadow(0 0 4px ${accent});"></div>
  </div>`;
}
