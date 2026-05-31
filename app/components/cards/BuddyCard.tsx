import { useEffect, useMemo, useRef } from "react";
import { RefreshCw, User, Zap } from "lucide-react";
import gsap from "gsap";
import { CardShell } from "../atoms/CardShell";
import { CardHeader } from "../atoms/CardHeader";
import { AiBadge } from "../atoms/AiBadge";
import { LegendDot } from "../atoms/LegendDot";
import { RiderAvatar } from "./RiderAvatar";
import type { BuddyCardProps } from "./card-types";

export function BuddyCard({ profile, riders, onRefresh, onSelectRider }: BuddyCardProps) {
  const radarRef = useRef<HTMLDivElement>(null);
  const ridersLayerRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  const max = useMemo(
    () => (riders ? Math.max(...riders.riders.map((r) => r.distance_m), 1500) : 1500),
    [riders],
  );

  useEffect(() => {
    if (!radarRef.current) return;

    const ctx = gsap.context(() => {
      const radar = radarRef.current;
      if (!radar) return;

      const sweep = radar.querySelector(".radar-sweep");
      const sweepGlow = radar.querySelector(".radar-sweep-glow");
      const grid = radar.querySelector(".radar-grid");
      const pulseRings = Array.from(radar.querySelectorAll(".radar-pulse-ring"));
      const scanNoise = radar.querySelector(".radar-scan-noise");
      const self = radar.querySelector(".radar-self");

      gsap.to(sweep, {
        rotation: 360,
        duration: 4.8,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(sweepGlow, {
        rotation: 360,
        duration: 7.2,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(grid, {
        scale: 1.018,
        rotation: 2.4,
        duration: 5.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        transformOrigin: "50% 50%",
      });
      gsap.to(scanNoise, {
        backgroundPosition: "96px 0",
        autoAlpha: 0.7,
        duration: 2.8,
        ease: "none",
        repeat: -1,
      });
      gsap.fromTo(
        pulseRings,
        { scale: 0.28, autoAlpha: 0.58 },
        {
          scale: 1.45,
          autoAlpha: 0,
          duration: 2.4,
          ease: "power2.out",
          stagger: 0.62,
          repeat: -1,
        },
      );
      gsap.to(self, {
        scale: 1.12,
        duration: 1.45,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        transformOrigin: "50% 50%",
      });
    }, radarRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!ridersLayerRef.current || !riders) return;
    const ctx = gsap.context(() => {
      const nodes = ridersLayerRef.current?.querySelectorAll<HTMLButtonElement>(".rider-dot") ?? [];

      gsap.fromTo(
        nodes,
        { autoAlpha: 0, scale: 0.35, filter: "blur(8px)" },
        {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.72,
          ease: "back.out(1.8)",
          stagger: 0.045,
        },
      );

      if (refreshButtonRef.current) {
        gsap.fromTo(
          refreshButtonRef.current,
          { scale: 0.94, autoAlpha: 0.55 },
          { scale: 1, autoAlpha: 1, duration: 0.46, ease: "power2.out" },
        );
      }

      nodes.forEach((node, idx) => {
        const baseBearing = Number(node.dataset.bearing);
        const distRatio = Number(node.dataset.distratio);
        const driftAmp = 6 + Math.random() * 7;
        const driftPeriod = 8 + Math.random() * 5;
        const startOffset = Math.random() * driftPeriod;
        const statusPhase = idx * 0.28;

        gsap.to(
          { t: startOffset },
          {
            t: startOffset + driftPeriod,
            duration: driftPeriod,
            ease: "none",
            repeat: -1,
            onUpdate: function () {
              const t = (this.targets()[0] as { t: number }).t;
              const bearing = baseBearing + Math.sin((t / driftPeriod) * Math.PI * 2) * driftAmp;
              const radiusWave = Math.sin((t / driftPeriod) * Math.PI * 2 + statusPhase) * 11;
              const rad = (bearing * Math.PI) / 180;
              const radius = distRatio * 145 + radiusWave;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              node.style.transform = `translate(${x}px, ${y}px)`;
            },
          },
        );

        gsap.to(node.querySelector(".rider-avatar-shell"), {
          y: idx % 2 === 0 ? -8 : 8,
          scale: 1.11,
          duration: 1.45 + idx * 0.06,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: idx * 0.05,
        });
      });
    }, ridersLayerRef);

    return () => ctx.revert();
  }, [riders]);

  const handleRefresh = () => {
    if (refreshButtonRef.current) {
      gsap.fromTo(
        refreshButtonRef.current.querySelector("svg"),
        { rotation: 0 },
        { rotation: 360, duration: 0.7, ease: "power3.out", transformOrigin: "50% 50%" },
      );
    }
    onRefresh();
  };

  return (
    <CardShell accent={profile.accent} poster="/posters/poster-c2.jpg">
      <div className="absolute inset-0 flex flex-col p-4">
        <CardHeader
          title={`附近共 ${riders?.total ?? 0} 位骑友`}
          titleBadge={<AiBadge label="AI 雷达" accent={profile.accent} />}
          subtitle={`${riders?.ridingNow ?? 0} 人骑行中 · ${riders?.openToInvite ?? 0} 人想约骑`}
          right={
            <button
              type="button"
              ref={refreshButtonRef}
              onClick={handleRefresh}
              aria-label="刷新雷达"
              className="pl-fg grid h-8 w-8 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-white/58 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={14} />
            </button>
          }
        />

        <div ref={radarRef} className="relative mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl">
          <div
            className="radar-grid pointer-events-none absolute aspect-square w-[330px] rounded-full"
            style={{
              background: `
                radial-gradient(circle at center, transparent 0 16%, rgba(255,255,255,0.13) 16.3% 16.8%, transparent 17.1% 32%, rgba(255,255,255,0.10) 32.3% 32.8%, transparent 33.1% 49%, rgba(255,255,255,0.10) 49.3% 49.8%, transparent 50.1% 66%, rgba(255,255,255,0.13) 66.3% 66.8%, transparent 67.1%),
                linear-gradient(90deg, transparent calc(50% - .5px), rgba(255,255,255,0.12) 50%, transparent calc(50% + .5px)),
                linear-gradient(0deg, transparent calc(50% - .5px), rgba(255,255,255,0.12) 50%, transparent calc(50% + .5px)),
                radial-gradient(circle at center, ${profile.accentSoft}, transparent 64%)
              `,
              boxShadow: `inset 0 0 48px ${profile.accent}18, 0 0 70px ${profile.accent}12`,
            }}
          />
          <span
            className="radar-sweep-glow pointer-events-none absolute aspect-square w-[330px] rounded-full opacity-55 blur-xl"
            style={{
              background: `conic-gradient(from -12deg, transparent 0deg, ${profile.accent}00 260deg, ${profile.accent}44 330deg, ${profile.accent}99 356deg, transparent 360deg)`,
            }}
          />
          <span
            className="radar-sweep pointer-events-none absolute aspect-square w-[330px] rounded-full mix-blend-screen"
            style={{
              background: `conic-gradient(from -8deg, transparent 0deg, transparent 292deg, ${profile.accent}10 316deg, ${profile.accent}78 352deg, ${profile.accent} 359deg, transparent 360deg)`,
              maskImage: "radial-gradient(circle at center, transparent 0 6%, black 7% 100%)",
              WebkitMaskImage: "radial-gradient(circle at center, transparent 0 6%, black 7% 100%)",
            }}
          />
          <span
            className="radar-scan-noise pointer-events-none absolute aspect-square w-[330px] rounded-full opacity-35 mix-blend-screen"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0 10px, ${profile.accent}18 11px 12px, transparent 13px 24px)`,
              backgroundSize: "96px 100%",
              maskImage: "radial-gradient(circle at center, black 0 68%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 0 68%, transparent 72%)",
            }}
          />
          {[0, 1, 2].map((i) => (
            <span
              key={`pulse-${i}`}
              className="radar-pulse-ring pointer-events-none absolute aspect-square w-[240px] rounded-full border"
              style={{ borderColor: profile.accent, boxShadow: `0 0 22px ${profile.accent}33` }}
            />
          ))}
          <div className="pointer-events-none absolute inset-x-5 top-1/2 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <div className="pointer-events-none absolute inset-y-5 left-1/2 w-px bg-gradient-to-b from-transparent via-white/18 to-transparent" />

          <div className="radar-self absolute z-10 flex h-14 w-14 items-center justify-center" aria-label="self">
            <span
              className="absolute h-full w-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${profile.accent}30, transparent 62%)`,
                boxShadow: `0 0 30px ${profile.accentSoft}`,
              }}
            />
            <div
              className="relative grid h-12 w-12 place-items-center rounded-full border-2"
              style={{
                background: "linear-gradient(135deg, #1f1f29, #34344c)",
                borderColor: profile.accent,
                boxShadow: `0 0 24px ${profile.accentSoft}, inset 0 0 16px rgba(255,255,255,0.08)`,
              }}
            >
              <User size={19} />
              <Zap size={10} className="absolute -right-0.5 -top-0.5" style={{ color: profile.accent }} />
            </div>
          </div>
          <div ref={ridersLayerRef} className="pl-fg absolute inset-0" style={{ willChange: "transform" }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {riders?.riders.map((rider) => {
                const distRatio = Math.min(rider.distance_m / max, 1) * 0.9;
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
                    <span className="rider-avatar-shell block">
                      <RiderAvatar rider={rider} accent={profile.accent} />
                    </span>
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
