"use client";

import { Layers3, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadAmap } from "../../lib/amap-loader";
import type { LatLng } from "../../lib/geo";

type AnyAMap = {
  Map: new (
    container: HTMLElement,
    opts: Record<string, unknown>,
  ) => AnyMapInstance;
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
  remove(o: AnyOverlay): void;
  setFitView(arr?: AnyOverlay[]): void;
  setPitch(p: number): void;
  setRotation?(deg: number): void;
  getPitch(): number;
  destroy(): void;
};

type AnyOverlay = unknown;

export type RealAmapProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  polyline: LatLng[];
  accent: string;
  /** 缺 key 时显示的回落 UI */
  fallback?: React.ReactNode;
};

export function RealAmap({ origin, destination, polyline, accent, fallback }: RealAmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMapInstance | null>(null);
  const overlaysRef = useRef<AnyOverlay[]>([]);
  const trafficRef = useRef<AnyOverlay | null>(null);
  const satelliteRef = useRef<AnyOverlay | null>(null);
  const amapRef = useRef<AnyAMap | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
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
          zoom: 14,
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
        // ignore destroy race
      }
      mapRef.current = null;
      amapRef.current = null;
      overlaysRef.current = [];
      trafficRef.current = null;
      satelliteRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    for (const o of overlaysRef.current) map.remove(o);
    overlaysRef.current = [];

    if (origin) {
      const m = new ns.Marker({
        position: [origin.lng, origin.lat],
        anchor: "center",
        content: markerHtml("起点", accent, "#000"),
      });
      map.add(m);
      overlaysRef.current.push(m);
    }
    if (destination) {
      const m = new ns.Marker({
        position: [destination.lng, destination.lat],
        anchor: "center",
        content: markerHtml("终点", "#fff", "#000"),
      });
      map.add(m);
      overlaysRef.current.push(m);
    }
    if (polyline.length >= 2) {
      const path = polyline.map((p) => [p.lng, p.lat]);
      const line = new ns.Polyline({
        path,
        strokeColor: accent,
        strokeWeight: 6,
        strokeOpacity: 0.95,
        lineJoin: "round",
        showDir: true,
      });
      map.add(line);
      overlaysRef.current.push(line);
      map.setFitView();
    } else if (origin && destination) {
      const line = new ns.Polyline({
        path: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        strokeColor: accent,
        strokeWeight: 3,
        strokeOpacity: 0.6,
        strokeStyle: "dashed",
      });
      map.add(line);
      overlaysRef.current.push(line);
      map.setFitView();
    }
  }, [ready, origin, destination, polyline, accent]);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    if (showTraffic && !trafficRef.current) {
      const t = new ns.TileLayer.Traffic({ autoRefresh: true, interval: 60, zIndex: 10 });
      map.add(t);
      trafficRef.current = t;
    } else if (!showTraffic && trafficRef.current) {
      map.remove(trafficRef.current);
      trafficRef.current = null;
    }
  }, [ready, showTraffic]);

  useEffect(() => {
    if (!ready || !mapRef.current || !amapRef.current) return;
    const ns = amapRef.current;
    const map = mapRef.current;
    if (showSatellite && !satelliteRef.current) {
      const s = new ns.TileLayer.Satellite({ zIndex: 5 });
      map.add(s);
      satelliteRef.current = s;
    } else if (!showSatellite && satelliteRef.current) {
      map.remove(satelliteRef.current);
      satelliteRef.current = null;
    }
  }, [ready, showSatellite]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setPitch(is3D ? 50 : 0);
  }, [ready, is3D]);

  if (error) {
    return (
      <div className="pl-mid mt-3 relative h-[200px] overflow-hidden rounded-2xl border border-white/12 bg-black/35">
        {fallback ?? (
          <div className="grid h-full place-items-center px-4 text-center text-[12px] text-white/55">
            地图加载失败: {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="pl-mid mt-3 relative h-[200px] overflow-hidden rounded-2xl border border-white/12 bg-black/35"
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
      </div>
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

function markerHtml(text: string, bg: string, color: string) {
  return `<div style="
    background:${bg};
    color:${color};
    padding:4px 8px;
    border-radius:999px;
    font-size:10px;
    font-weight:700;
    box-shadow:0 4px 14px rgba(0,0,0,0.5);
    transform:translate(-50%,-100%);
    border:2px solid white;
  ">${text}</div>`;
}
