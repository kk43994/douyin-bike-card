import { Bike, Locate, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type AmapPoi,
  type AmapTip,
  BIKE_RELATED_TYPES,
  fetchInputTips,
  fetchPoiAround,
} from "../../lib/amap";
import type { GeoLocation, LatLng } from "../../lib/geo";

export type PickedDestination = {
  name: string;
  hint?: string;
  loc: LatLng;
  source: "amap" | "self";
};

export function DestinationPicker({
  origin,
  city,
  accent,
  onPick,
  onClose,
}: {
  origin: GeoLocation | null;
  city?: string;
  accent: string;
  onPick: (d: PickedDestination) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [tips, setTips] = useState<AmapTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [bikeOnly, setBikeOnly] = useState(true);
  const [hotSpots, setHotSpots] = useState<AmapPoi[]>([]);
  const [hotLoading, setHotLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const originLoc = useMemo<LatLng | undefined>(
    () => (origin ? { lng: origin.lng, lat: origin.lat } : undefined),
    [origin],
  );

  useEffect(() => {
    if (!originLoc) {
      setHotLoading(false);
      return;
    }
    setHotLoading(true);
    fetchPoiAround(originLoc, { types: BIKE_RELATED_TYPES, radius: 5000 })
      .then((list) => {
        setHotSpots(list.slice(0, 8));
      })
      .finally(() => setHotLoading(false));
  }, [originLoc]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!keyword.trim()) {
      setTips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await fetchInputTips(
          keyword.trim(),
          originLoc,
          city,
          bikeOnly ? BIKE_RELATED_TYPES : undefined,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setTips(list);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [keyword, originLoc, city, bikeOnly]);

  return (
    <>
      <div
        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-[78px] left-3 right-3 z-50 max-h-[72vh] overflow-hidden rounded-3xl border border-white/15 bg-[#0c0f16]/96 shadow-[0_24px_50px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between px-4 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              想骑去哪
            </p>
            <h3 className="mt-0.5 text-base font-semibold">挑一个目的地</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2">
            <Search size={14} className="text-white/55" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={bikeOnly ? "搜公园 / 绿道 / 景区 / 自行车店" : "搜任意地点"}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            {loading && <span className="text-[10px] text-white/55">查询中…</span>}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBikeOnly(true)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition"
              style={
                bikeOnly
                  ? { background: `${accent}26`, color: accent, boxShadow: `0 0 0 1px ${accent}55` }
                  : { color: "rgba(255,255,255,0.55)" }
              }
            >
              <Bike size={11} /> 骑行相关
            </button>
            <button
              type="button"
              onClick={() => setBikeOnly(false)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
              style={
                !bikeOnly
                  ? { background: "rgba(255,255,255,0.12)", color: "white" }
                  : { color: "rgba(255,255,255,0.55)" }
              }
            >
              全部地点
            </button>
          </div>
          {origin?.cityName && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-white/45">
              <Locate size={10} />
              <span className="truncate">{compactCity(origin.cityName)}</span>
            </p>
          )}
        </div>

        <div className="mt-3 max-h-[46vh] overflow-y-auto px-4 pb-4">
          {tips.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                搜索结果
              </p>
              {tips.map((tip) => (
                <PoiRow
                  key={tip.id}
                  accent={accent}
                  title={tip.name}
                  subtitle={[tip.district, tip.address].filter(Boolean).join(" · ")}
                  onClick={() =>
                    onPick({
                      name: tip.name,
                      hint: tip.address || tip.district,
                      loc: tip.location,
                      source: "amap",
                    })
                  }
                />
              ))}
            </div>
          ) : keyword && !loading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
              没有结果, 试试其他关键词或切换到「全部地点」
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-white/40">
                <Bike size={11} />
                附近热门骑行地点
              </p>
              {hotLoading && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
                  正在拉取你附近的骑行点…
                </div>
              )}
              {!hotLoading && hotSpots.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
                  附近 5km 没找到合适的骑行点, 试试上方搜索
                </div>
              )}
              {hotSpots.map((p) => (
                <PoiRow
                  key={p.id}
                  accent={accent}
                  title={p.name}
                  subtitle={`${formatDistance(p.distance_m)} · ${p.type.split(";").pop() ?? "骑行点"}`}
                  onClick={() =>
                    onPick({
                      name: p.name,
                      hint: p.address || p.type.split(";").pop() || "",
                      loc: p.location,
                      source: "amap",
                    })
                  }
                />
              ))}
            </div>
          )}

          {origin && (
            <button
              type="button"
              onClick={() =>
                onPick({
                  name: "环线 (起终点同地)",
                  hint: origin.cityName ? compactCity(origin.cityName) : undefined,
                  loc: { lng: origin.lng, lat: origin.lat },
                  source: "self",
                })
              }
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] py-2 text-xs font-semibold text-white hover:bg-white/[0.1]"
            >
              <Locate size={13} />
              起终点都设为我的位置
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function PoiRow({
  title,
  subtitle,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left hover:bg-white/[0.08]"
    >
      <MapPin size={14} className="mt-0.5 shrink-0" color={accent} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle && <p className="truncate text-[11px] text-white/55">{subtitle}</p>}
      </div>
    </button>
  );
}

/** "浙江省温州市瓯海区茶山街道灵运路温州大学北校区" → "温州·瓯海区" */
function compactCity(s: string): string {
  const cityMatch = s.match(/([一-龥]{2,4}市)/);
  const districtMatch = s.match(/([一-龥]{2,4}区)/);
  const parts: string[] = [];
  if (cityMatch) parts.push(cityMatch[1].replace(/市$/, ""));
  if (districtMatch) parts.push(districtMatch[1]);
  return parts.length > 0 ? parts.join(" · ") : s.slice(0, 20);
}

function formatDistance(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}
