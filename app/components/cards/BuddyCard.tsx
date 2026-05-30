import { useEffect, useMemo, useRef } from "react";
import { RefreshCw, User } from "lucide-react";
import gsap from "gsap";
import { CardShell } from "../atoms/CardShell";
import { LegendDot } from "../atoms/LegendDot";
import { RiderAvatar } from "./RiderAvatar";
import type { BuddyCardProps } from "./card-types";

export function BuddyCard({ profile, riders, onRefresh, onSelectRider }: BuddyCardProps) {
  const radarRef = useRef<HTMLDivElement>(null);
  const ridersLayerRef = useRef<HTMLDivElement>(null);

  const max = useMemo(
    () => (riders ? Math.max(...riders.riders.map((r) => r.distance_m), 1500) : 1500),
    [riders],
  );

  useEffect(() => {
    if (!ridersLayerRef.current || !riders) return;
    const nodes = ridersLayerRef.current.querySelectorAll<HTMLDivElement>(".rider-dot");
    const tweens: gsap.core.Tween[] = [];
    nodes.forEach((node) => {
      const baseBearing = Number(node.dataset.bearing);
      const distRatio = Number(node.dataset.distratio);
      const driftAmp = 4 + Math.random() * 4;
      const driftPeriod = 14 + Math.random() * 8;
      const startOffset = Math.random() * driftPeriod;
      const tween = gsap.to(
        { t: startOffset },
        {
          t: startOffset + driftPeriod,
          duration: driftPeriod,
          ease: "none",
          repeat: -1,
          onUpdate: function () {
            const t = (this.targets()[0] as { t: number }).t;
            const bearing = baseBearing + Math.sin((t / driftPeriod) * Math.PI * 2) * driftAmp;
            const rad = (bearing * Math.PI) / 180;
            const radius = distRatio * 130;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            node.style.transform = `translate(${x}px, ${y}px)`;
          },
        },
      );
      tweens.push(tween);
    });

    if (radarRef.current) {
      const sweeps = radarRef.current.querySelectorAll(".radar-sweep-ring");
      gsap.fromTo(
        sweeps,
        { scale: 0.2, autoAlpha: 0.9 },
        { scale: 1.6, autoAlpha: 0, duration: 1.1, ease: "power2.out", stagger: 0.16, repeat: 1 },
      );
    }

    return () => {
      for (const t of tweens) t.kill();
    };
  }, [riders]);

  return (
    <CardShell accent={profile.accent}>
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="pl-mid flex items-center justify-between" style={{ willChange: "transform" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
              卡 2 · 附近骑友雷达
            </p>
            <h3 className="mt-1 text-[20px] font-bold leading-tight">
              附近共 {riders?.total ?? 0} 位骑友
            </h3>
            <p className="text-[12px] text-white/55">
              {riders?.ridingNow ?? 0} 人骑行中 · {riders?.openToInvite ?? 0} 人想约骑
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-white/65 hover:bg-white/10"
          >
            <RefreshCw size={11} className="mr-1 inline" />
            刷新
          </button>
        </div>

        <div ref={radarRef} className="relative mt-3 flex flex-1 items-center justify-center">
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <span
              key={r}
              className="absolute rounded-full border border-white/12"
              style={{
                width: r * 280,
                height: r * 280,
                boxShadow: `inset 0 0 ${20 * r}px ${profile.accent}11`,
              }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <span
              key={`sw-${i}`}
              className="radar-sweep-ring absolute rounded-full border"
              style={{ width: 60, height: 60, borderColor: profile.accent, opacity: 0 }}
            />
          ))}
          <div className="absolute h-full w-px bg-white/8" />
          <div className="absolute h-px w-full bg-white/8" />

          <div className="absolute z-10 flex h-12 w-12 items-center justify-center" aria-label="self">
            <div
              className="grid h-12 w-12 place-items-center rounded-full border-2"
              style={{
                background: "linear-gradient(135deg, #1f1f29, #3a3a55)",
                borderColor: profile.accent,
                boxShadow: `0 0 24px ${profile.accentSoft}`,
              }}
            >
              <User size={20} />
            </div>
          </div>
          <div ref={ridersLayerRef} className="pl-fg absolute inset-0" style={{ willChange: "transform" }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {riders?.riders.map((rider) => {
                const distRatio = Math.min(rider.distance_m / max, 1) * 0.95;
                return (
                  <button
                    type="button"
                    key={rider.id}
                    onClick={() => onSelectRider(rider)}
                    className="rider-dot absolute -translate-x-1/2 -translate-y-1/2"
                    data-bearing={rider.bearing_deg}
                    data-distratio={distRatio}
                    style={{ top: 0, left: 0 }}
                  >
                    <RiderAvatar rider={rider} accent={profile.accent} />
                  </button>
                );
              })}
            </div>
          </div>

          <p className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/35">
            雷达半径 ~ {(max / 1000).toFixed(1)} km
          </p>
        </div>

        <div
          className="pl-fg mt-2 grid grid-cols-3 gap-2 text-[10px] text-white/55"
          style={{ willChange: "transform" }}
        >
          <LegendDot color="#4ade80" label="骑行中" />
          <LegendDot color={profile.accent} label="想约骑" />
          <LegendDot color="#94a3b8" label="休息中" />
        </div>

        <p
          className="pl-fg mt-2 text-center text-[10px] text-white/40"
          style={{ willChange: "transform" }}
        >
          点头像约骑 · → 滑回卡 1 路线推荐
        </p>
      </div>
    </CardShell>
  );
}
