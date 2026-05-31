import { Bike, Locate, MapPin, Search, X } from "lucide-react";
import { gsap } from "gsap";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bikeFilterRef = useRef<HTMLButtonElement | null>(null);
  const allFilterRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  const trimmedKeyword = keyword.trim();
  const visibleTips = trimmedKeyword ? tips : [];
  const resultAnimationKey = visibleTips.map((tip) => tip.id).join("|");
  const hotSpotAnimationKey = hotSpots.map((spot) => spot.id).join("|");
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const originLoc = useMemo<LatLng | undefined>(
    () => (origin ? { lng: origin.lng, lat: origin.lat } : undefined),
    [origin],
  );

  useEffect(() => {
    if (!originLoc) return;
    let cancelled = false;
    fetchPoiAround(originLoc, { types: BIKE_RELATED_TYPES, radius: 5000 })
      .then((list) => {
        if (cancelled) return;
        setHotSpots(list.slice(0, 8));
      })
      .finally(() => {
        if (!cancelled) setHotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originLoc]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!trimmedKeyword) return;
    const controller = new AbortController();
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const list = await fetchInputTips(
          trimmedKeyword,
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
  }, [trimmedKeyword, originLoc, city, bikeOnly]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.22, ease: "power2.out" },
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 28, scale: 0.98, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.42,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".destination-stagger",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.045, delay: 0.12, ease: "power2.out" },
      );
    }, panelRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !listRef.current) return;
    const rows = gsap.utils.toArray<HTMLElement>(".destination-poi-row", listRef.current);
    if (rows.length === 0) return;
    gsap.fromTo(
      rows,
      { opacity: 0, y: 12, scale: 0.985 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.28,
        stagger: 0.035,
        ease: "power2.out",
        overwrite: "auto",
      },
    );
  }, [reducedMotion, resultAnimationKey, hotSpotAnimationKey, hotLoading, trimmedKeyword]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (reducedMotion) {
      onClose();
      return;
    }
    gsap
      .timeline({ onComplete: onClose })
      .to(panelRef.current, {
        opacity: 0,
        y: 18,
        scale: 0.985,
        filter: "blur(6px)",
        duration: 0.18,
        ease: "power2.in",
      })
      .to(overlayRef.current, { opacity: 0, duration: 0.14, ease: "power2.in" }, "<");
  }, [onClose, reducedMotion]);

  const setFilter = useCallback(
    (nextBikeOnly: boolean) => {
      setBikeOnly(nextBikeOnly);
      if (reducedMotion) return;
      const target = nextBikeOnly ? bikeFilterRef.current : allFilterRef.current;
      gsap.fromTo(
        target,
        { scale: 0.96 },
        { scale: 1, duration: 0.34, ease: "elastic.out(1, 0.65)", overwrite: "auto" },
      );
    },
    [reducedMotion],
  );

  return (
    <>
      <div
        ref={overlayRef}
        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        className="absolute bottom-[78px] left-3 right-3 z-50 max-h-[72vh] overflow-hidden rounded-[26px] border border-white/15 bg-[#0c0f16]/96 shadow-[0_24px_50px_rgba(0,0,0,0.65)]"
      >
        <div className="destination-stagger flex items-start justify-between px-4 pt-4">
          <div>
            <p className="text-[10px] leading-none tracking-[0.2em] text-white/45">
              想骑去哪
            </p>
            <h3 className="mt-2 text-[19px] font-semibold leading-none tracking-normal">
              挑一个目的地
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/75 transition hover:rotate-90 hover:bg-white/10 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        <div className="destination-stagger px-4 pt-4">
          <div className="group flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 transition focus-within:border-white/25 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_0_3px_rgba(35,240,255,0.08)]">
            <Search size={14} className="text-white/55 transition group-focus-within:text-white/80" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={bikeOnly ? "搜公园 / 绿道 / 景区 / 自行车店" : "搜任意地点"}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-white placeholder:text-white/35 focus:outline-none"
            />
            {loading && <span className="text-[10px] text-white/55">查询中…</span>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              ref={bikeFilterRef}
              type="button"
              onClick={() => setFilter(true)}
              className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium leading-none transition hover:-translate-y-0.5 active:scale-[0.96]"
              style={
                bikeOnly
                  ? { background: `${accent}26`, color: accent, boxShadow: `0 0 0 1px ${accent}55` }
                  : { color: "rgba(255,255,255,0.55)" }
              }
            >
              <Bike size={13} /> 骑行相关
            </button>
            <button
              ref={allFilterRef}
              type="button"
              onClick={() => setFilter(false)}
              className="h-8 rounded-full px-3 text-[13px] font-medium leading-none transition hover:-translate-y-0.5 active:scale-[0.96]"
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
            <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-none text-white/45">
              <Locate size={11} />
              <span className="truncate">{compactCity(origin.cityName)}</span>
            </p>
          )}
        </div>

        <div ref={listRef} className="destination-stagger mt-4 max-h-[46vh] overflow-y-auto px-4 pb-4">
          {visibleTips.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] leading-none tracking-[0.18em] text-white/40">
                搜索结果
              </p>
              {visibleTips.map((tip) => (
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
          ) : trimmedKeyword && !loading ? (
            <div className="destination-poi-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-5 text-white/55">
              没有结果, 试试其他关键词或切换到「全部地点」
            </div>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] leading-none tracking-[0.12em] text-white/42">
                <Bike size={12} />
                附近热门骑行地点
              </p>
              {!originLoc && (
                <div className="destination-poi-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-5 text-white/55">
                  定位完成后会推荐附近骑行点, 也可以直接搜索目的地
                </div>
              )}
              {originLoc && hotLoading && (
                <div className="destination-poi-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-5 text-white/55">
                  正在拉取你附近的骑行点…
                </div>
              )}
              {originLoc && !hotLoading && hotSpots.length === 0 && (
                <div className="destination-poi-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-5 text-white/55">
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
              className="destination-poi-row mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.97]"
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
      className="destination-poi-row group flex w-full items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.08] active:scale-[0.985]"
    >
      <MapPin
        size={14}
        className="mt-0.5 shrink-0 transition duration-200 group-hover:scale-110"
        color={accent}
      />
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
